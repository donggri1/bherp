import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../common/types/current-user.type';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RoleMenuPermission)
    private readonly roleMenuPermissionRepository: Repository<RoleMenuPermission>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.loginId = :loginId', { loginId: dto.loginId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = await this.issueTokens(user);
    await this.userRepository.update(
      { id: user.id, companyId: user.companyId },
      {
        refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        lastLoginAt: new Date(),
      },
    );

    return {
      ...tokens,
      user: this.toSafeUser(user),
      permissions: await this.getPermissions(user.id, user.companyId),
    };
  }

  async refresh(currentUser: CurrentUser & { refreshToken?: string }) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id: currentUser.userId })
      .andWhere('user.companyId = :companyId', { companyId: currentUser.companyId })
      .getOne();

    if (!user?.refreshTokenHash || !currentUser.refreshToken) {
      throw new UnauthorizedException('Refresh token이 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(currentUser.refreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException('Refresh token이 올바르지 않습니다.');

    const tokens = await this.issueTokens(user);
    await this.userRepository.update(
      { id: user.id, companyId: user.companyId },
      { refreshTokenHash: await bcrypt.hash(tokens.refreshToken, 10) },
    );
    return tokens;
  }

  async logout(user: CurrentUser) {
    await this.userRepository.update(
      { id: user.userId, companyId: user.companyId },
      { refreshTokenHash: null },
    );
    return { loggedOut: true };
  }

  async me(user: CurrentUser) {
    const entity = await this.userRepository.findOne({
      where: { id: user.userId, companyId: user.companyId },
    });
    if (!entity) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    return {
      user: this.toSafeUser(entity),
      permissions: await this.getPermissions(user.userId, user.companyId),
    };
  }

  private async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      loginId: user.loginId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.accessExpiresIn',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiresIn',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      companyId: user.companyId,
      loginId: user.loginId,
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private async getPermissions(userId: number, companyId: number) {
    const userRoles = await this.userRoleRepository.find({ where: { userId, companyId } });
    const roleIds = userRoles.map((item) => item.roleId);
    if (!roleIds.length) return [];

    return this.roleMenuPermissionRepository
      .createQueryBuilder('permission')
      .where('permission.companyId = :companyId', { companyId })
      .andWhere('permission.roleId IN (:...roleIds)', { roleIds })
      .getMany();
  }
}
