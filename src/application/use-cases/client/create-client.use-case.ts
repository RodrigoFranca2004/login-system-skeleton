import { IClientRepository } from "@domain/repositories/IClientRepository";
import { ClientOutputDTO, CreateClientInputDTO } from "../../dtos/client.dto";
import { BusinessRuleError } from "@application/errors/application-errors";
import { injectable, inject } from "tsyringe";
import { IMessageBroker } from "@application/providers/IMessageBroker";
@injectable()
export class CreateClientUseCase {
  private readonly CLIENT_EXCHANGE = "client.events";
  private readonly CLIENT_CREATED_ROUTING_KEY = "client.created";

  constructor(
    @inject("IClientRepository")
    private clientRepository: IClientRepository,

    @inject("IMessageBroker")
    private messageBroker: IMessageBroker
  ) {}

  async execute(input: CreateClientInputDTO): Promise<ClientOutputDTO> {
    const emailExists = await this.clientRepository.findByEmail(input.email);
    if (emailExists) {
      throw new BusinessRuleError("A client with this email already exists.");
    }

    const newClient = await this.clientRepository.create(input);

    try {
      await this.messageBroker.publish(
        this.CLIENT_EXCHANGE,
        this.CLIENT_CREATED_ROUTING_KEY,
        {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
        }
      );
      console.log('[MESSAGE_BROKER] "client.created" event published.');
    } catch (err) {
      console.error(
        '[MESSAGE_BROKER] Failed to publish "client.created" event.',
        err
      );
    }

    const output: ClientOutputDTO = {
      id: newClient.id,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      createdAt: newClient.createdAt,
      updatedAt: newClient.updatedAt,
    };

    return output;
  }
}
