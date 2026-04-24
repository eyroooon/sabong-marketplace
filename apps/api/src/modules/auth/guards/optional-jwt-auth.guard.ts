import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Optional JWT guard: if a valid token is present, populates req.user.
 * If missing or invalid, allows the request through with req.user = undefined.
 *
 * Use this on endpoints that behave differently for logged-in vs anonymous
 * viewers — e.g. a public group list that marks "isMember" for the viewer.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  /** Always allow the request; just try to populate req.user on success. */
  handleRequest<T = any>(
    _err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): T {
    return user || (null as any);
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
