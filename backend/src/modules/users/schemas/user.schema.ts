import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NAME_RULES } from '../../../common/constants/validation.constants';

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: NAME_RULES.minLength,
    maxlength: NAME_RULES.maxLength,
  })
  name!: string;

  @Prop({ required: true, select: false })
  password!: string;

  createdAt!: Date;

  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
