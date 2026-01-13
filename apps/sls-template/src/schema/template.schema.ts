import * as mongoose from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({
  collection: 'templates',
  timestamps: true,
})
export class Template {
  @Prop({
    type: String,
    required: true,
  })
  name!: string;

  // Dynamic JSON blobs (editor state)
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  image!: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  typography!: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  entityInfoDesign!: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  contactInfoDesign!: Record<string, any>;

  // Container-level styles (ex: width/padding/grid/etc.)
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  design!: Record<string, any>;

  // Layout tree (row/col/leaf) or any layout model you store
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true, default: {} })
  layout!: Record<string, any>;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: undefined,
  })
  networksGroup?: Record<string, any>;

  @Prop({
    type: String,
    required: false,
  })
  html?: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ createdAt: -1 });
