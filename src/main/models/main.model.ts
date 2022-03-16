import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
export class Captcha {
    @Field()
    id: string
    @Field()
    base64: string
    @Field()
    sha256: string
    @Field({nullable: true})
    createdAt: string
    @Field({nullable: true})
    value: string
}

@ObjectType()
export class Payload {
    @Field()
    id: string
    @Field()
    createdAt: string
    @Field()
    value: string
}