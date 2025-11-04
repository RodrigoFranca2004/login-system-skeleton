import { IClientRepository } from "@domain/repositories/IClientRepository";
import { ClientOutputDTO } from "../../dtos/client.dto";
import { ResourceNotFoundError } from "../../errors/application-errors";
import { injectable, inject } from "tsyringe";
import { ICacheProvider } from "@application/providers/ICacheProvider";

@injectable()
export class GetClientByIdUseCase {
  private readonly cacheKeyPrefix = "client";

  constructor(
    @inject("IClientRepository")
    private clientRepository: IClientRepository,

    @inject("ICacheProvider")
    private cacheProvider: ICacheProvider
  ) {}

  async execute(id: string): Promise<ClientOutputDTO> {
    const cacheKey = `${this.cacheKeyPrefix}:${id}`;

    try {
      const cachedData = await this.cacheProvider.get(cacheKey);

      if (cachedData) {
        console.log("[CACHE] Hit! Serving from cache.");

        const cachedDTO = JSON.parse(cachedData);

        cachedDTO.createdAt = new Date(cachedDTO.createdAt);
        cachedDTO.updatedAt = new Date(cachedDTO.updatedAt);
        
        return cachedDTO as ClientOutputDTO;
      }
    } catch (error) {
      console.warn("[CACHE] Failed to retrieve from cache.", error);
    }

    console.log("[CACHE] Miss! Fetching from database.");
    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new ResourceNotFoundError("Client not found.");
    }

    const output: ClientOutputDTO = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };

    try {
      const ONE_HOUR_IN_SECONDS = 3600;
      await this.cacheProvider.save(cacheKey, output, ONE_HOUR_IN_SECONDS);
    } catch (error) {
      console.warn("[CACHE] Failed to save to cache.", error);
    }

    return output;
  }
}
