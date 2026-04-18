import { Injectable, OnModuleInit } from "@nestjs/common";
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigService } from "@nestjs/config";


@Injectable()
export class KeycloakService {
  private kcAdmin: KeycloakAdminClient

  constructor(
    private readonly configService: ConfigService
  ) {
    this.kcAdmin = new KeycloakAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_HOST'),
      realmName: this.configService.get<string>('KEYCLOAK_REALM'),
    })
  }


  async onModuleInit() {
    await this.authenticate()
  }

  private async authenticate() {
    await this.kcAdmin.auth({
      grantType: "client_credentials",
      clientId: this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET'),
    })
  }

  async createUser(data: {
    email: string,
    password: string
  }) {
    const { id } = await this.kcAdmin.users.create({
      username: data.email,
      email: data.email,
      enabled: true,
      emailVerified: false,
      credentials: [{
        type: "password",
        value: data.password,
        temporary: false
      }]
    })
    return id;
  }

  async updateUser(data: {
    keycloakId: string,
    email: string,
  }) {
    await this.kcAdmin.users.update({
      id: data.keycloakId
    }, {
      email: data.email,
      username: data.email
    })
  }

  async findUserById(keycloakId: string) {
    return await this.kcAdmin.users.findOne({
      id: keycloakId
    })
  }

  async resetPassword(keycloakId: string, newPassword: string) {
    await this.kcAdmin.users.resetPassword({
      id: keycloakId,
      credential: {
        type: "password",
        value: newPassword,
        temporary: false
      }
    })
  }

  async sendVerifyEmail(keycloakId: string): Promise<void> {
    await this.kcAdmin.users.sendVerifyEmail({ id: keycloakId });
  }

  async deleteUser(keycloakId: string) {
    await this.kcAdmin.users.del({
      id: keycloakId
    })
  }
}