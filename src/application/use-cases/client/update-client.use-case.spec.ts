import 'reflect-metadata';

import { UpdateClientUseCase } from './update-client.use-case';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { ICacheProvider } from '@application/providers/ICacheProvider';
import { ResourceNotFoundError, BusinessRuleError } from '@application/errors/application-errors';
import { Client } from '@domain/entities/client.entity';

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

const originalClient = Client.create({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '123456',
});

const updatedClient = Client.restore(
  {
    name: 'John Doe Updated',
    email: 'john.doe.updated@example.com',
    phone: '987654',
  },
  {
    id: originalClient.id,
    createdAt: originalClient.createdAt,
    updatedAt: new Date(),
  }
);

const updatedClientOutputDTO = {
  id: updatedClient.id,
  name: updatedClient.name,
  email: updatedClient.email,
  phone: updatedClient.phone,
  createdAt: updatedClient.createdAt,
  updatedAt: updatedClient.updatedAt,
};


describe('UpdateClientUseCase (Unit Test)', () => {
  let updateClientUseCase: UpdateClientUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    updateClientUseCase = new UpdateClientUseCase(
      mockClientRepository,
      mockCacheProvider
    );
  });

  it('should update a client, invalidate the cache, and return the updated DTO', async () => {
    const input = {
      name: updatedClient.name,
      email: updatedClient.email,
    };
    const cacheKey = `client:${originalClient.id}`;

    (mockClientRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockClientRepository.update as jest.Mock).mockResolvedValue(updatedClient);

    const output = await updateClientUseCase.execute(originalClient.id, input);

    expect(mockClientRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockClientRepository.update).toHaveBeenCalledWith(originalClient.id, input);
    expect(mockCacheProvider.invalidate).toHaveBeenCalledWith(cacheKey);
    expect(output).toEqual(updatedClientOutputDTO);
  });

  it('should throw ResourceNotFoundError if the client to update does not exist', async () => {
    const input = { name: 'Test' };
    const nonExistentId = 'non-existent-id';
    
    (mockClientRepository.update as jest.Mock).mockResolvedValue(null);

    await expect(
      updateClientUseCase.execute(nonExistentId, input)
    ).rejects.toThrow(ResourceNotFoundError);

    expect(mockClientRepository.update).toHaveBeenCalledWith(nonExistentId, input);
    expect(mockCacheProvider.invalidate).not.toHaveBeenCalled();
  });

  it('should throw BusinessRuleError if the new email is already in use by another client', async () => {
    const input = { email: 'taken@example.com' };
    
    const anotherClient = Client.create({
      name: 'Jane Doe',
      email: 'taken@example.com',
    });

    (mockClientRepository.findByEmail as jest.Mock).mockResolvedValue(anotherClient);

    await expect(
      updateClientUseCase.execute(originalClient.id, input)
    ).rejects.toThrow(BusinessRuleError);

    expect(mockClientRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockClientRepository.update).not.toHaveBeenCalled();
    expect(mockCacheProvider.invalidate).not.toHaveBeenCalled();
  });

  it('should allow update if the email found belongs to the same client being updated', async () => {
    const input = { name: 'John Doe New Name' };
    const cacheKey = `client:${originalClient.id}`;

    // Simulate an input where the email is provided but is the same as the original
    const inputWithSameEmail = {
      name: 'John Doe New Name',
      email: originalClient.email,
    };
    
    const updatedClientWithNewName = Client.restore(
      { ...originalClient, name: 'John Doe New Name' },
      originalClient
    );
    
    (mockClientRepository.findByEmail as jest.Mock).mockResolvedValue(originalClient);
    (mockClientRepository.update as jest.Mock).mockResolvedValue(updatedClientWithNewName);

    await updateClientUseCase.execute(originalClient.id, inputWithSameEmail);

    expect(mockClientRepository.findByEmail).toHaveBeenCalledWith(originalClient.email);
    expect(mockClientRepository.update).toHaveBeenCalledWith(originalClient.id, inputWithSameEmail);
    expect(mockCacheProvider.invalidate).toHaveBeenCalledWith(cacheKey);
  });
});