import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { SellersService } from "./sellers.service";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { UpgradePlanDto } from "./dto/upgrade-plan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const documentFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        "Only jpg, png, webp images and pdf files are allowed",
      ),
      false,
    );
  }
};

@Controller("sellers")
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post("register")
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser("id") userId: string,
    @Body() dto: RegisterSellerDto,
  ) {
    return this.sellersService.register(userId, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  getMyProfile(@CurrentUser("id") userId: string) {
    return this.sellersService.getMyProfile(userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  updateMyProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: Partial<RegisterSellerDto>,
  ) {
    return this.sellersService.updateProfile(userId, dto);
  }

  @Post("me/documents")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "governmentId", maxCount: 1 },
        { name: "farmPermit", maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        fileFilter: documentFileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
      },
    ),
  )
  uploadDocuments(
    @CurrentUser("id") userId: string,
    @UploadedFiles()
    files: {
      governmentId?: Express.Multer.File[];
      farmPermit?: Express.Multer.File[];
    },
  ) {
    if (
      (!files.governmentId || files.governmentId.length === 0) &&
      (!files.farmPermit || files.farmPermit.length === 0)
    ) {
      throw new BadRequestException("At least one document file is required");
    }
    return this.sellersService.uploadDocuments(userId, files);
  }

  // ----- Seller Plans -----

  @Get("plans")
  getPlans() {
    return this.sellersService.getPlans();
  }

  @Get("me/plan")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  getMyPlan(@CurrentUser("id") userId: string) {
    return this.sellersService.getMyPlan(userId);
  }

  @Post("me/plan/upgrade")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("seller", "admin")
  upgradePlan(
    @CurrentUser("id") userId: string,
    @Body() dto: UpgradePlanDto,
  ) {
    return this.sellersService.upgradePlan(userId, dto.plan);
  }

  @Get(":id")
  getPublicProfile(@Param("id") id: string) {
    return this.sellersService.getPublicProfile(id);
  }
}

@Controller("admin/sellers")
export class AdminSellersController {
  constructor(private sellersService: SellersService) {}

  @Patch(":id/verify")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  verifySeller(
    @Param("id") sellerId: string,
    @Body() body: { action: "verified" | "rejected"; note?: string },
  ) {
    if (!["verified", "rejected"].includes(body.action)) {
      throw new BadRequestException(
        'Action must be either "verified" or "rejected"',
      );
    }
    return this.sellersService.adminVerifySeller(
      sellerId,
      body.action,
      body.note,
    );
  }
}
