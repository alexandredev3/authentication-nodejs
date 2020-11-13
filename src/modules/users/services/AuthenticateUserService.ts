import { sign } from 'jsonwebtoken';
import { injectable, inject } from 'tsyringe';
import authConfig from '@config/auth';

import User from '@modules/users/infrastructure/typeorm/entities/User';
import IUsersRepository from '@modules/users/repositories/ICreateUsersRepository';
import IHashProvider from '@modules/users/providers/HashProvider/models/IHashProvider';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: User,
  token: string;
}

@injectable()
class AuthenticateUserService {
  
  private usersRepository: IUsersRepository;
  private hashProvider: IHashProvider;

  constructor(

    @inject('UsersRepository')
    usersRepository: IUsersRepository,

    @inject('HashProvider')
    hashProvider: IHashProvider

  ) {
    this.usersRepository = usersRepository;
    this.hashProvider = hashProvider;
  }

  public async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new Error('User does not exists');
    }

    if (!(await this.hashProvider.compareHash(password, user.encrypted_password))) {
      throw new Error('Incorrect Password/email validate');
    }

    const token = sign({}, authConfig.secret, {
      subject: user.id,
      expiresIn: authConfig.expires_in
    })

    return {
      user,
      token
    }
  }
}

export default AuthenticateUserService;