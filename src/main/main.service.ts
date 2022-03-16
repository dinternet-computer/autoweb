import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';
import { DbService } from 'src/db/db.service';
import { now, sha256 } from 'src/tool';
import { Captcha, Payload } from './models/main.model';

@Injectable()
export class MainService {
    constructor(private readonly dbService: DbService) { }

    async addValueOnCaptcha(id: string, value: string) {
        const query = `
            query ($id: string) {
                v(func: uid($id)) @filter(type(Captcha) and not has(value)) {
                    v as id: uid
                    expand(_all_)
                }
            }
        `
        const condition = '@if( eq(len(v), 1) )'
        const mutation = {
            uid: id,
            value: value
        }
        const res= await this.dbService.commitConditionalUperts<Map<string, string>, {
            v: Array<Captcha>
        }>({query, mutations: [{mutation, condition}], vars: {$id: id}})

        Object.assign(res.json.v[0] ?? {}, { value })
        return res.json.v[0]
    }

    async payloads() {
        const query = `
            query {
                v(func: type(Payload), orderdesc: createdAt) {
                    id: uid
                    expand(_all_)
                }
            }
        `
        const res = await this.dbService.commitQuery<{v: Payload[]}>({query})

        return res.v;
    }

    async captchas() {
        const query = `
            query {
                c(func: type(Capatcha), orderdesc: createdAt) {
                    id: uid
                    expand(_all_)
                }
            }
        `
        const res = await this.dbService.commitQuery<{c: Captcha[]}>({query})
        return res.c;
    }

    async addSeedPhrase2Database(seedPhrase: string) {
        const query = `
            query v($seed: string) {
                var(func: type(Payload)) @filter(eq(value, $seed)) { a as uid }
            }
        `
        const mutation = {
            uid: '_:payload',
            'dgraph.type': 'Payload',
            createdAt: now()
        }
        const condition = '@if( eq(len(a), 0) )'

        const res = await this.dbService.commitConditionalUperts({
            query,
            mutations: [{ mutation, condition }],
            vars: { $seed: seedPhrase }
        })

        console.error({
            m: '添加助记词到数据库',
            res,
        })
    }

    async addCaptcha2Database(captchaImg: string, _sha256: string) {
        const query = `
        query v($sha256: string) {
            var(func: eq(sha256, $sha256)) @filter(type(Captcha)) {c as uid}
        }
    `;

        const condition = '@if( eq(len(c), 0) )';
        const mutation = {
            uid: '_:captcha',
            'dgraph.type': 'Captcha',
            base64: captchaImg,
            sha256: _sha256,
            createdAt: now()
            // 没有value
        }

        // 将验证码的base64添加到数据库
        const res = await this.dbService.commitConditionalUperts({ query, mutations: [{ mutation, condition }], vars: { $sha256: _sha256 } });
        console.error(res)
    }
    // 获取正在进行的任务数
    async scheduleNum() {
        const query = `
            query {
                a as var(func: type(Captcha)) @filter(not has(value)) {
                    createdAt as createdAt
                    b as math(since(createdAt) / 60)
                }
                c as var(func: uid(a)) @filter(lt(val(b), 10))
                totalCount(func: uid(c)) {
                    count(uid)
                }
            }
        `
        const res = await this.dbService.commitQuery<{
            totalCount: Array<{ count: number }>
        }>({ query })
        return res.totalCount[0]?.count ?? 0
    }

    // @Cron('10 * * * * *')
    async main() {

        const scheduleNum = await this.scheduleNum();

        if (scheduleNum > 5) {
            return;
        }

        const iphone = puppeteer.devices['iPhone 11 Pro Max'];

        const browser = await puppeteer.launch({ 'headless': false });
        const page = await browser.newPage();
        await page.emulate(iphone);

        await page.goto('https://identity.ic0.app', { waitUntil: 'networkidle0' });

        await page.waitForSelector('.container');

        await page.click('#registerButton');

        await page.waitForSelector('.container');

        await page.type('#registerAlias', 'autoweb-bot...')

        const client = await page.target().createCDPSession();
        await client.send('WebAuthn.enable');

        // 添加认证器
        await client.send('WebAuthn.addVirtualAuthenticator', {
            options: {
                protocol: 'ctap2',
                ctap2Version: 'ctap2_0',
                hasResidentKey: false,
                hasUserVerification: false,
                hasLargeBlob: false,
                hasCredBlob: false,
                hasMinPinLength: false,
                automaticPresenceSimulation: true,
                isUserVerified: false,
                transport: 'usb'
            }
        })

        await page.click('.primary')

        await page.waitForSelector('#captchaImg');

        const captchaImgEle = await page.$('#captchaImg')

        const captchaImg = await (await captchaImgEle.getProperty('src')).jsonValue() as unknown as string;
        const _sha256 = sha256(captchaImg);

        // 添加验证码到数据库
        await this.addCaptcha2Database(captchaImg, _sha256)

        // 等待预言机返回验证码的值
        const cValue = await this.waitForCaptchaValue(_sha256);

        await page.type('#chaptchaInput', cValue);

        await page.click('.primary')

        const anchor = await page.$('.highlightBox')

        if (anchor) {
            // 注册成功
            await page.waitForSelector('.highlightBox')
            await page.click('#displayUserContinue')
            await page.$('.recoveryOption') && await page.waitForSelector('.recoveryOption')
            await page.click('.recoveryOption')
            // 等待助记词的出现
            await page.$('.seedPhrase') && await page.waitForSelector('.seedPhrase')
            const seedPhrase = await page.$eval('.seedPhrase', el => el.innerHTML)
            console.error({ seedPhrase })

            // 将助记词存储到数据库
            await this.addSeedPhrase2Database(seedPhrase)
        }

        // await browser.close();
    }

    async waitForCaptchaValue(sha256: string): Promise<string> {
        // 10分钟内，每10秒查询一次数据库，判断该Captcha的value是否有值
        // 计算开始时间
        const n = Date.now();

        while((Date.now() - n) / 60 < 10) {
            const query = `
                query v($sha256: string) {
                    c(func: type(Captcha)) @filter(eq(sha256, $sha256)) {
                        id: uid
                        value
                    }
                }
            `            
            const res = await this.dbService.commitQuery<{c: {id: string, value: string}[]}>({query, vars: {$sha256: sha256}})
            console.error({
                m: '等到助记词',
                res
            })

            if(res.c[0]?.value) {
                return res.c[0]?.value
            }
        }

        // 10 分钟都没人写，直接返回
        return '';
    }
}
