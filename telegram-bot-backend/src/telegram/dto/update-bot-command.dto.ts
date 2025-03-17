import { PartialType } from '@nestjs/mapped-types';
import { CreateBotCommandDto } from './create-bot-command.dto';

export class UpdateBotCommandDto extends PartialType(CreateBotCommandDto) {} 