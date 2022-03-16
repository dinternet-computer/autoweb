import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
export class Captcha {
    @Field()
    base64: string
    @Field()
    sha256: string
    @Field()
    createdAt: string
    @Field()
    value: string
}

@ObjectType()
export class Payload {
    @Field()
    createdAt: string
    @Field()
    value: string
}