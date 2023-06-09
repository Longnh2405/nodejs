import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/entity/user.entity';
import { resolveError } from 'src/error/error';
import { UserService } from './user.service';
import { AdminGuard } from 'src/auth/admin.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserDTO } from 'src/dto/UserDTO/user.dto';
import { LoginLogoutDTO } from 'src/dto/UserDTO/login.logout.dto';
import { CreateUserDTO } from 'src/dto/UserDTO/createUser.dto';
import { UpdateUserDTO } from 'src/dto/UserDTO/updateUser.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
  ) {}

  @UseGuards(AdminGuard)
  @Post()
  async createUser(
    @Body() user: CreateUserDTO,
    @Res() res: Response,
    @Req() request: Request,
  ): Promise<void> {
    user.password = await bcrypt.hash(user.password, 10);
    await this.userService.createUser(user);
    res.status(HttpStatus.OK).send(`
    {
        "code": ${HttpStatus.OK},
        "success": true,
        "message": "Thêm người dùng thành công"
    }`);
  }

  @Post('login')
  async UserLogin(
    @Body() user: LoginLogoutDTO,
    @Res() res: Response,
  ): Promise<void> {
    const auth_token = await this.authService.login(
      user.username,
      user.password,
    );
    res.status(HttpStatus.OK).send(auth_token);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async UserLogout(@Req() request: Request, @Res() res: Response) {
    try {
      const userInfo = request['user'];
      const user = await this.userService.findOneByID(userInfo.id);
      if (user) {
        user.authen_token = null;
        await this.userService.updateUser(user.id, user);
        res.status(HttpStatus.OK).send('Đăng xuất thành công!');
      } else {
        throw new HttpException(
          {
            code: HttpStatus.BAD_REQUEST,
            success: false,
            message: 'BAD REQUEST',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      resolveError(error);
    }
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  async getUser(
    @Req() request: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    try {
      const userInfo = request['user'];
      const userFindByToken = await this.userService.findOneByID(userInfo.id);
      const user = await this.userService.findOneByID(id);
      if (userFindByToken.id === Number(id) || userFindByToken.type === 1) {
        res.status(HttpStatus.OK).send({
          id: user.id,
          username: user.username,
          type: user.type,
        });
      } else {
        throw new HttpException(
          {
            code: HttpStatus.BAD_REQUEST,
            success: false,
            message: 'BAD REQUEST',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      resolveError(error);
    }
  }

  @UseGuards(AuthGuard)
  @Put('/:id')
  async updateUser(
    @Req() request: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() userUpdate: UpdateUserDTO,
  ) {
    try {
      const userInfo = request['user'];
      const userFindByToken = await this.userService.findOneByID(userInfo.id);
      const user = await this.userService.findOneByID(id);
      if (userFindByToken.id === Number(id) || userFindByToken.type === 1) {
        user.username = userUpdate.username;
        if (userUpdate.password !== null) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        await this.userService.updateUser(id, user);
        res.status(HttpStatus.OK).send({
          username: user.username,
        });
      } else {
        throw new HttpException(
          {
            code: HttpStatus.BAD_REQUEST,
            success: false,
            message: 'BAD REQUEST',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      resolveError(error);
    }
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  async deleteUser(
    @Req() request: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    try {
      const userInfo = request['user'];
      const userFindByToken = await this.userService.findOneByID(userInfo.id);
      const user = await this.userService.findOneByID(id);
      if (userFindByToken.id === Number(id) || userFindByToken.type === 1) {
        user.authen_token = null;
        await this.userService.updateUser(id, user);
        await this.userService.deleteUser(id);
        res.status(HttpStatus.OK).send(`
    {
        "code": ${HttpStatus.OK},
        "success": true,
        "message": "Xoá thành công"
    }`);
      } else {
        throw new HttpException(
          {
            code: HttpStatus.BAD_REQUEST,
            success: false,
            message: 'BAD REQUEST',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      resolveError(error);
    }
  }
}
