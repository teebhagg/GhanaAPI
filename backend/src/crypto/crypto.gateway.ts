import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CryptoService } from './crypto.service';
import { FindOneCryptoDto } from './dto/find-one-crypto.dto';
import { GetAllCoinsDto } from './dto/get-all-coins.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: false,
  },
})
export class CryptoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('CryptoGateway');
  private clientIntervals = new Map<string, NodeJS.Timeout>();
  private readonly updateInterval: number;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {
    this.updateInterval =
      this.configService.get<number>('CRYPTO_UPDATE_INTERVAL_MS') || 60000;
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('CryptoGateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    args.forEach((arg) => {
      this.logger.log(`Argument: ${arg}`);
    });
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clearClientInterval(client.id);
  }

  private clearClientInterval(clientId: string): void {
    try {
      const interval = this.clientIntervals.get(clientId);
      if (interval) {
        clearInterval(interval);
        this.clientIntervals.delete(clientId);
        this.logger.debug(`Cleared interval for client: ${clientId}`);
      }
    } catch (error) {
      this.logger.error(
        `Error clearing interval for client ${clientId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private emitError(
    client: Socket,
    event: string,
    error: unknown,
    defaultMessage: string,
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : defaultMessage;
    this.logger.error(`${event} error: ${errorMessage}`);
    client.emit(event, {
      error: defaultMessage,
      details: errorMessage,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('findAllCrypto')
  async findAll(@ConnectedSocket() client: Socket) {
    // Clear any existing interval for this client
    this.clearClientInterval(client.id);

    // Emit initial data immediately
    try {
      const data = await this.cryptoService.findAll();
      client.emit('findAllCryptoData', {
        data: data,
        timestamp: new Date(),
      });
    } catch (error) {
      this.emitError(
        client,
        'findAllCryptoData',
        error,
        'Failed to fetch crypto data',
      );
    }

    // Set up interval to emit data periodically
    const interval = setInterval(() => {
      void (async () => {
        try {
          const data = await this.cryptoService.findAll();
          client.emit('findAllCryptoData', {
            data: data,
            timestamp: new Date(),
          });
        } catch (error) {
          this.emitError(
            client,
            'findAllCryptoData',
            error,
            'Failed to fetch crypto data',
          );
        }
      })();
    }, this.updateInterval);

    // Store the interval so we can clear it on disconnect
    this.clientIntervals.set(client.id, interval);

    return { status: 'started' };
  }

  @SubscribeMessage('findOneCrypto')
  async findOne(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: FindOneCryptoDto | string,
  ) {
    // Handle both DTO and plain string for backward compatibility
    const id = typeof dto === 'string' ? dto : dto?.id;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      this.emitError(
        client,
        'findOneCryptoData',
        new Error('Invalid crypto ID'),
        'Invalid crypto ID provided',
      );
      return { status: 'error', message: 'Invalid crypto ID' };
    }

    // Clear any existing interval for this client
    this.clearClientInterval(client.id);

    // Emit initial data immediately
    try {
      const data = await this.cryptoService.findOne(id);
      client.emit('findOneCryptoData', {
        data: data,
        timestamp: new Date(),
      });
    } catch (error) {
      this.emitError(
        client,
        'findOneCryptoData',
        error,
        'Failed to fetch crypto data',
      );
    }

    // Store the id in closure for interval callback
    const cryptoId = id.trim();

    // Set up interval to emit data periodically
    const interval = setInterval(() => {
      void (async () => {
        try {
          const data = await this.cryptoService.findOne(cryptoId);
          client.emit('findOneCryptoData', {
            data: data,
            timestamp: new Date(),
          });
        } catch (error) {
          this.emitError(
            client,
            'findOneCryptoData',
            error,
            'Failed to fetch crypto data',
          );
        }
      })();
    }, this.updateInterval);

    // Store the interval so we can clear it on disconnect
    this.clientIntervals.set(client.id, interval);

    return { status: 'started', cryptoId: cryptoId };
  }

  @SubscribeMessage('getAllCoins')
  async getAllCoins(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto?: GetAllCoinsDto,
  ) {
    // Clear any existing interval for this client
    this.clearClientInterval(client.id);

    const page = dto?.page ?? 1;
    const perPage = dto?.perPage ?? 10;

    // Emit initial data immediately
    try {
      const data = await this.cryptoService.getAllCoins(page, perPage);
      client.emit('getAllCoinsData', {
        data: data.data,
        page: data.page,
        total: data.total,
        timestamp: new Date(),
      });
    } catch (error) {
      this.emitError(
        client,
        'getAllCoinsData',
        error,
        'Failed to fetch coins data',
      );
      return { status: 'error', message: 'Failed to fetch coins data' };
    }

    // Store page and perPage in closure for interval callback
    const pageNum = page;
    const perPageNum = perPage;

    // Set up interval to emit data periodically
    const interval = setInterval(() => {
      void (async () => {
        try {
          const data = await this.cryptoService.getAllCoins(
            pageNum,
            perPageNum,
          );
          client.emit('getAllCoinsData', {
            data: data.data,
            page: data.page,
            total: data.total,
            timestamp: new Date(),
          });
        } catch (error) {
          this.emitError(
            client,
            'getAllCoinsData',
            error,
            'Failed to fetch coins data',
          );
        }
      })();
    }, this.updateInterval);

    // Store the interval so we can clear it on disconnect
    this.clientIntervals.set(client.id, interval);

    return { status: 'started', page, perPage };
  }
}
