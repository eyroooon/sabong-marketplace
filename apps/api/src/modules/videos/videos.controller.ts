import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { VideosService } from "./videos.service";
import { CreateVideoDto } from "./dto/create-video.dto";
import { FeedQueryDto } from "./dto/feed-query.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SanitizePipe } from "../../common/pipes/sanitize.pipe";

const videoFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const allowed = ["video/mp4", "video/webm", "video/quicktime"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        "Only mp4, webm, and quicktime videos are allowed",
      ),
      false,
    );
  }
};

@Controller("videos")
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("video", {
      storage: memoryStorage(),
      fileFilter: videoFileFilter,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateVideoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Video file is required");
    }
    return this.videosService.create(userId, dto, file);
  }

  @Get()
  getFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser("id") userId?: string,
  ) {
    return this.videosService.getFeed(query, userId);
  }

  @Get(":id")
  findById(
    @Param("id") id: string,
    @CurrentUser("id") userId?: string,
  ) {
    return this.videosService.findById(id, userId);
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  like(
    @CurrentUser("id") userId: string,
    @Param("id") videoId: string,
  ) {
    return this.videosService.like(userId, videoId);
  }

  @Delete(":id/like")
  @UseGuards(JwtAuthGuard)
  unlike(
    @CurrentUser("id") userId: string,
    @Param("id") videoId: string,
  ) {
    return this.videosService.unlike(userId, videoId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser("id") userId: string,
    @Param("id") videoId: string,
  ) {
    return this.videosService.remove(videoId, userId);
  }

  // -------------------- Comments --------------------

  @Get(":id/comments")
  listComments(@Param("id") videoId: string) {
    return this.videosService.listComments(videoId);
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param("id") videoId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.videosService.createComment(videoId, userId, dto);
  }

  @Delete("comments/:commentId")
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param("commentId") commentId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.videosService.deleteComment(commentId, userId);
  }

  @Post(":id/share")
  share(@Param("id") videoId: string) {
    return this.videosService.share(videoId);
  }
}
