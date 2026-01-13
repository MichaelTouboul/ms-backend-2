import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Template } from './schema/template.schema';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Template.name) private readonly TemplateModel: Model<Template>,
  ) {}

  async create(payload: any) {
    try {
      const newTemplate = await new this.TemplateModel(payload).save();
      return { id: newTemplate._id };
    } catch (err) {
      throw new Error(err);
    }
  }
}
