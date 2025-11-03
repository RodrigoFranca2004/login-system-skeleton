import { container } from "tsyringe";

// --- Cache ---
import { ICacheProvider } from "@application/providers/ICacheProvider";
import { RedisCacheProvider } from "@infra/cache/RedisCacheProvider";

// --- Messaging ---
import { IMessageBroker } from "@application/providers/IMessageBroker";
import { RabbitMQProvider } from "@infra/messaging/RabbitMQProvider";
import { startClientCreatedConsumer } from '@infra/messaging/consumers/client-created.consumer';

// --- Domain Repositories ---
import { IClientRepository } from "@domain/repositories/IClientRepository";
import { MongoClientRepository } from "@infra/database/mongodb/repositories/MongoClientRepository";

// --- Use Cases ---
import { CreateClientUseCase } from "@application/use-cases/client/create-client.use-case";
import { GetClientByIdUseCase } from "@application/use-cases/client/get-client-by-id.use-case";
import { ListClientsUseCase } from "@application/use-cases/client/list-clients.use-case";
import { UpdateClientUseCase } from "@application/use-cases/client/update-client.use-case";
import { DeleteClientUseCase } from "@application/use-cases/client/delete-client.use-case";

// --- MESSAGE BROKER REGISTRATION ---
container.registerSingleton<IMessageBroker>(
  'IMessageBroker',     
  RabbitMQProvider      
);

// --- CACHE PROVIDER REGISTRATION ---
container.registerSingleton<ICacheProvider>(
  "ICacheProvider",
  RedisCacheProvider
);

// --- REPOSITORY REGISTRATION ---
container.registerSingleton<IClientRepository>(
  "IClientRepository",
  MongoClientRepository
);

// --- USE CASE REGISTRATION ---
container.register("CreateClientUseCase", CreateClientUseCase);
container.register("GetClientByIdUseCase", GetClientByIdUseCase);
container.register("ListClientsUseCase", ListClientsUseCase);
container.register("UpdateClientUseCase", UpdateClientUseCase);
container.register("DeleteClientUseCase", DeleteClientUseCase);

(async () => {
  try {
    // Resolve o broker que acabamos de registrar
    const messageBroker = container.resolve<IMessageBroker>('IMessageBroker');
    
    // Inicia o consumidor
    await startClientCreatedConsumer(messageBroker);

  } catch (error) {
    console.error('[CONTAINER] Failed to start message consumers:', error);
  }
})();