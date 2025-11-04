import 'reflect-metadata';

import { DeleteClientUseCase } from './delete-client.use-case';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { ICacheProvider } from '@application/providers/ICacheProvider';
import { ResourceNotFoundError } from '@application/errors/application-errors';
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

const mockCacheProvider: ICacheProvider = {
  save: jest.fn(),
  get: jest.fn(),
  invalidate: jest.fn(),
};

const mockClient = Client.create({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '123456',
});

const mockClientOutputDTO = {
  id: mockClient.id,
  name: mockClient.name,
  email: mockClient.email,
  phone: mockClient.phone,
  createdAt: mockClient.createdAt,
  updatedAt: mockClient.updatedAt,
};

describe('DeleteClientUseCase (Unit Test)', () => {
  let deleteClientUseCase: DeleteClientUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteClientUseCase = new DeleteClientUseCase(
      mockClientRepository,
      mockCacheProvider
    );
  });

  it('should delete a client, invalidate the cache, and return the deleted DTO', async () => {
    const cacheKey = `client:${mockClient.id}`;

    // Arrange: Mock the repository to return the deleted client
    (mockClientRepository.delete as jest.Mock).mockResolvedValue(mockClient);

    // Act
    const output = await deleteClientUseCase.execute(mockClient.id);

    // Assert
    expect(mockClientRepository.delete).toHaveBeenCalledWith(mockClient.id);
    expect(mockCacheProvider.invalidate).toHaveBeenCalledWith(cacheKey);
    expect(output).toEqual(mockClientOutputDTO);
  });

  it('should throw ResourceNotFoundError if the client to delete does not exist', async () => {
    const nonExistentId = 'non-existent-id';
    const cacheKey = `client:${nonExistentId}`;

    // Arrange: Mock the repository to return null (client not found)
    (mockClientRepository.delete as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(
      deleteClientUseCase.execute(nonExistentId)
    ).rejects.toThrow(ResourceNotFoundError);

    expect(mockClientRepository.delete).toHaveBeenCalledWith(nonExistentId);
    expect(mockCacheProvider.invalidate).not.toHaveBeenCalled(); // Nothing to invalidate
  });
});