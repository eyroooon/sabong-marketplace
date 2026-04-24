import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { CreatePostDto } from "./dto/create-post.dto";

@Controller("groups")
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  /** POST /groups — create new group (authenticated). */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser("id") userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(userId, dto);
  }

  /** GET /groups — list all groups. Optional category + search filters. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser("id") viewerId: string | undefined,
    @Query("category") category?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string,
  ) {
    return this.groupsService.listGroups(viewerId ?? null, {
      category,
      q,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** GET /groups/mine — list groups I'm a member of. */
  @Get("mine")
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser("id") userId: string) {
    return this.groupsService.myGroups(userId);
  }

  /** GET /groups/:slug — get group by slug with membership info. */
  @Get(":slug")
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(
    @CurrentUser("id") viewerId: string | undefined,
    @Param("slug") slug: string,
  ) {
    return this.groupsService.getBySlug(slug, viewerId ?? null);
  }

  /** POST /groups/:id/join — join a group. */
  @Post(":id/join")
  @UseGuards(JwtAuthGuard)
  join(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.groupsService.join(id, userId);
  }

  /** POST /groups/:id/leave — leave a group. */
  @Post(":id/leave")
  @UseGuards(JwtAuthGuard)
  leave(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.groupsService.leave(id, userId);
  }

  /** GET /groups/:id/members — list active members. */
  @Get(":id/members")
  @UseGuards(OptionalJwtAuthGuard)
  members(
    @CurrentUser("id") viewerId: string | undefined,
    @Param("id") id: string,
  ) {
    return this.groupsService.listMembers(id, viewerId ?? null);
  }

  /** GET /groups/:id/posts — list group's post feed. */
  @Get(":id/posts")
  @UseGuards(OptionalJwtAuthGuard)
  posts(
    @CurrentUser("id") viewerId: string | undefined,
    @Param("id") id: string,
  ) {
    return this.groupsService.listPosts(id, viewerId ?? null);
  }

  /** POST /groups/:id/posts — create a post in the group. */
  @Post(":id/posts")
  @UseGuards(JwtAuthGuard)
  createPost(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.groupsService.createPost(id, userId, dto);
  }

  /** DELETE /groups/posts/:postId — delete a post. */
  @Delete("posts/:postId")
  @UseGuards(JwtAuthGuard)
  deletePost(
    @CurrentUser("id") userId: string,
    @Param("postId") postId: string,
  ) {
    return this.groupsService.deletePost(postId, userId);
  }
}
