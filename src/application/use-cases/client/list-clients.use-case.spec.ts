import 'reflect-metadata';

import { ListClientsUseCase } from './list-clients.use-case';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { Client } from '@domain/entities/client.entity';

// Mocks
const mockClientRepository: IClientRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Mock data
const client1 = Client.create({
  name: 'John Doe',
  email: 'john@example.com',
});

const client2 = Client.create({
  name: 'Jane Doe',
  email: 'jane@example.com',
});

const mockClientList = [client1, client2];

describe('ListClientsUseCase (Unit Test)', () => {
  let listClientsUseCase: ListClientsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    // Note: This use case only depends on the repository
    listClientsUseCase = new ListClientsUseCase(mockClientRepository);
  });

  it('should return a list of client DTOs', async () => {
    // Arrange: Mock the repository to return a list of Client entities
    (mockClientRepository.findAll as jest.Mock).mockResolvedValue(mockClientList);

    // Act
    const output = await listClientsUseCase.execute();

    // Assert
    expect(mockClientRepository.findAll).toHaveBeenCalledTimes(1);
    expect(output).toHaveLength(2);
    
    // Check if the output DTO matches the entity data
    expect(output[0].id).toBe(client1.id);
    expect(output[0].name).toBe(client1.name);
    expect(output[1].id).toBe(client2.id);
    expect(output[1].email).toBe(client2.email);
    
    // Ensure the output is a DTO (plain object), not a class instance
    expect(output[0]).not.toBeInstanceOf(Client);
  });

  it('should return an empty array if no clients are found', async () => {
    // Arrange: Mock the repository to return an empty array
    (mockClientRepository.findAll as jest.Mock).mockResolvedValue([]);

    // Act
    const output = await listClientsUseCase.execute();

    // Assert
    expect(mockClientRepository.findAll).toHaveBeenCalledTimes(1);
    expect(output).toHaveLength(0);
    expect(output).toEqual([]);
  });
});