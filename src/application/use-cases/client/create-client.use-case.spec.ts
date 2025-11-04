import 'reflect-metadata';

import { CreateClientUseCase } from './create-client.use-case';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { IMessageBroker } from '@application/providers/IMessageBroker';
import { BusinessRuleError } from '@application/errors/application-errors';
import { Client } from '@domain/entities/client.entity';

const mockClientRepository: IClientRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockMessageBroker: IMessageBroker = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  publish: jest.fn(),
  startConsumer: jest.fn(),
};

const mockClient = Client.create({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '123456',
});

describe('CreateClientUseCase (Unit Test)', () => {
  let createClientUseCase: CreateClientUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    createClientUseCase = new CreateClientUseCase(
      mockClientRepository,
      mockMessageBroker
    );
  });

  it('should create a new client and publish a message', async () => {
    const input = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123456',
    };

    (mockClientRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockClientRepository.create as jest.Mock).mockResolvedValue(mockClient);

    const output = await createClientUseCase.execute(input);

    expect(mockClientRepository.findByEmail).toHaveBeenCalledWith(input.email);
    expect(mockClientRepository.create).toHaveBeenCalledWith(input);
    expect(mockMessageBroker.publish).toHaveBeenCalledWith(
      'client.events',
      'client.created',
      expect.any(Object)
    );
    expect(output.name).toBe(input.name);
    expect(output.email).toBe(input.email);
  });

  it('should throw an error if email already exists', async () => {
    const input = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123456',
    };

    (mockClientRepository.findByEmail as jest.Mock).mockResolvedValue(mockClient);

    await expect(createClientUseCase.execute(input))
      .rejects.toThrow(BusinessRuleError);

    expect(mockClientRepository.create).not.toHaveBeenCalled();
    expect(mockMessageBroker.publish).not.toHaveBeenCalled();
  });
});