import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class MainService {
    async main() {
        const iphone = puppeteer.devices['iPhone 11 Pro Max'];

        const browser = await puppeteer.launch({'headless': false});
        const page = await browser.newPage();
        await page.emulate(iphone);

        await page.goto('https://identity.ic0.app', {waitUntil: 'networkidle0'});

        await page.waitForSelector('.container');

        await page.click('#registerButton');
        
        await page.waitForSelector('.container');

        await page.type('#registerAlias', 'autoweb-bot...')
        
        const client = await page.target().createCDPSession();
        await client.send('WebAuthn.enable');

        const addAuthenticatorRes = await client.send('WebAuthn.addVirtualAuthenticator', {
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

        const captchaImg = await (await page.$('#captchaImg'))

        const a = await (await captchaImg.getProperty('src')).jsonValue()

        console.error(a)
        
        console.error(addAuthenticatorRes)
        // await browser.close();
    }
}
