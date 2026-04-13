import ptBR from "../../messages/pt-BR.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof ptBR;
  }
}
