import 'reflect-metadata';

import { GetClientByIdUseCase } from './get-client-by-id.use-case';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { ICacheProvider } from '@application/providers/ICacheProvider';
import { ResourceNotFoundError } from '@application/errors/application-errors';
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

const cacheKey = `client:${mockClient.id}`;

describe('GetClientByIdUseCase (Unit Test)', () => {
  let getClientByIdUseCase: GetClientByIdUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    getClientByIdUseCase = new GetClientByIdUseCase(
      mockClientRepository,
      mockCacheProvider
    );
  });

  it('should return a client from cache (cache hit)', async () => {
    const mockCachedData = JSON.stringify(mockClientOutputDTO);
    (mockCacheProvider.get as jest.Mock).mockResolvedValue(mockCachedData);

    const output = await getClientByIdUseCase.execute(mockClient.id);

    expect(mockCacheProvider.get).toHaveBeenCalledWith(cacheKey);
    expect(mockClientRepository.findById).not.toHaveBeenCalled();
    expect(output).toEqual(mockClientOutputDTO);
  });

  it('should return a client from database on cache miss and save to cache', async () => {
    (mockCacheProvider.get as jest.Mock).mockResolvedValue(null);
    (mockClientRepository.findById as jest.Mock).mockResolvedValue(mockClient);

    const output = await getClientByIdUseCase.execute(mockClient.id);

    expect(mockCacheProvider.get).toHaveBeenCalledWith(cacheKey);
    expect(mockClientRepository.findById).toHaveBeenCalledWith(mockClient.id);
    expect(mockCacheProvider.save).toHaveBeenCalledWith(
      cacheKey,
      mockClientOutputDTO,
      3600
    );
    expect(output).toEqual(mockClientOutputDTO);
  });

  it('should throw ResourceNotFoundError if client is not found in cache or database', async () => {
    (mockCacheProvider.get as jest.Mock).mockResolvedValue(null);
    (mockClientRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      getClientByIdUseCase.execute(mockClient.id)
    ).rejects.toThrow(ResourceNotFoundError);

    expect(mockCacheProvider.get).toHaveBeenCalledWith(cacheKey);
    expect(mockClientRepository.findById).toHaveBeenCalledWith(mockClient.id);
    expect(mockCacheProvider.save).not.toHaveBeenCalled();
  });
});