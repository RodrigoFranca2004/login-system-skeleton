import { IMessageBroker } from '@application/providers/IMessageBroker';

export const startClientCreatedConsumer = async (broker: IMessageBroker) => {
  
  const EXCHANGE_NAME = 'client.events';
  const QUEUE_NAME = 'client.created.log'; // Nome da fila (o que o consumidor ouve)
  const ROUTING_KEY = 'client.created';   // Chave de roteamento (o que o produtor publica)

  try {
    // 1. Conectar ao broker (garante que a conexão existe)
    await broker.connect();
    
    // 2. Criar a "topologia" (Exchange, Fila, Binding)
    // Isso é feito no consumidor para garantir que a fila exista antes de consumir.
    const channel = (broker as any).channel; // Usamos 'any' por causa do nosso bypass
    if (!channel) {
      throw new Error('RabbitMQ channel is not available.');
    }

    // Garante que o Exchange (centro de triagem) exista
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    
    // Garante que a Fila (caixa de correio) exista
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // "Liga" o Exchange à Fila usando a Chave de Roteamento
    // "Toda msg no 'client.events' com a chave 'client.created' deve ir para a fila 'client.created.log'"
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    // 3. Inicia o consumidor
    console.log(`[CONSUMER] Starting consumer for queue '${QUEUE_NAME}'...`);
    await broker.startConsumer(QUEUE_NAME, async (message) => {
      // --- O QUE FAZER COM A MENSAGEM ---
      // Para o teste, vamos apenas logar a mensagem.
      // Em um app real, aqui você enviaria um e-mail, salvaria em outro DB, etc.
      console.log('[CONSUMER] Received "client.created" message:');
      console.log(JSON.stringify(message, null, 2));
    });

  } catch (error) {
    console.error(`[CONSUMER] Failed to start consumer for '${QUEUE_NAME}':`, error);
  }
};