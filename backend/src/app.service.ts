import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return "Welcome to Ghana API - Your gateway to Ghana's data and services";
  }
}
