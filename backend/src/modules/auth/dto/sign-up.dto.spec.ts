import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '../../../common/constants/validation.constants';
import { SignUpDto } from './sign-up.dto';

const validPayload = {
  email: 'jane@example.com',
  name: 'Jane Doe',
  password: 'Str0ng!pass',
};

async function errorsFor(
  payload: Record<string, unknown>,
): Promise<Record<string, string[]>> {
  const errors = await validate(plainToInstance(SignUpDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return Object.fromEntries(
    errors.map((error) => [
      error.property,
      Object.values(error.constraints ?? {}),
    ]),
  );
}

describe('SignUpDto', () => {
  it('accepts a valid payload', async () => {
    expect(await errorsFor(validPayload)).toEqual({});
  });

  it('trims and lowercases the email and trims the name', () => {
    const dto = plainToInstance(SignUpDto, {
      ...validPayload,
      email: '  Jane.DOE@Example.COM ',
      name: '  Jane Doe  ',
    });

    expect(dto.email).toBe('jane.doe@example.com');
    expect(dto.name).toBe('Jane Doe');
  });

  it.each([['not-an-email'], ['jane@'], [''], [undefined]])(
    'rejects email %p',
    async (email) => {
      expect((await errorsFor({ ...validPayload, email })).email).toEqual([
        EMAIL_MESSAGES.invalid,
      ]);
    },
  );

  it.each([['ab'], ['  ab  '], ['x'.repeat(51)], [''], [undefined]])(
    'rejects name %p',
    async (name) => {
      expect((await errorsFor({ ...validPayload, name })).name).toEqual([
        NAME_MESSAGES.length,
      ]);
    },
  );

  it.each([
    ['missing', undefined, PASSWORD_MESSAGES.required],
    ['empty', '', PASSWORD_MESSAGES.required],
    ['too short', 'Ab1!', PASSWORD_MESSAGES.minLength],
    ['too long', `A1!${'a'.repeat(126)}`, PASSWORD_MESSAGES.maxLength],
    ['without a letter', '12345678!', PASSWORD_MESSAGES.letter],
    ['without a number', 'Password!', PASSWORD_MESSAGES.number],
    [
      'without a special character',
      'Passw0rd',
      PASSWORD_MESSAGES.specialCharacter,
    ],
    ['with a line break', 'Passw0rd!\n', PASSWORD_MESSAGES.invalid],
  ])(
    'rejects a password %s with one specific message',
    async (_case, password, message) => {
      expect((await errorsFor({ ...validPayload, password })).password).toEqual(
        [message],
      );
    },
  );

  it('accepts passwords at the length boundaries', async () => {
    expect(await errorsFor({ ...validPayload, password: 'Abcde1!x' })).toEqual(
      {},
    );
    expect(
      await errorsFor({
        ...validPayload,
        password: `A1!${'a'.repeat(125)}`,
      }),
    ).toEqual({});
  });

  it('rejects unknown properties', async () => {
    expect((await errorsFor({ ...validPayload, role: 'admin' })).role).toEqual([
      'property role should not exist',
    ]);
  });
});
