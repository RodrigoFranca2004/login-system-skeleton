/**
 * Data Transfer Object for creating a new client.
 * This is the data that comes INTO the CreateClientUseCase.
 */
export interface CreateClientInputDTO {
  name: string;
  email: string;
  phone: string;
}

/**
 * Data Transfer Object for updating an existing client.
 * This is the data that comes INTO the UpdateClientUseCase.
 * All fields are optional.
 */
export interface UpdateClientInputDTO {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Data Transfer Object for client output.
 * This is the "safe" data that we return to the outside world (e.g., as JSON).
 * It doesn't contain sensitive entity methods or properties.
 */
export interface ClientOutputDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}