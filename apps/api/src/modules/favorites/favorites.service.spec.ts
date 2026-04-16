import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DRIZZLE } from "../../database/database.module";

/**
 * See auth.service.spec.ts for mock pattern.
 */
function createDbMock() {
  const terminalQueue: any[] = [];
  const valuesOverrides: any[] = [];

  const builder: any = {
    _queue(...items: any[]) {
      terminalQueue.push(...items);
      return this;
    },
    _queueValuesError(err: any) {
      valuesOverrides.push(err);
      return this;
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn(() => {
      const err = valuesOverrides.shift();
      if (err) return Promise.reject(err);
      return Promise.resolve(undefined);
    }),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    limit: jest.fn(() => Promise.resolve(terminalQueue.shift() ?? [])),
    returning: jest.fn(() => Promise.resolve(terminalQueue.shift() ?? [])),
  };
  return builder;
}

describe("FavoritesService", () => {
  let service: FavoritesService;
  let db: ReturnType<typeof createDbMock>;
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    db = createDbMock();
    notifications = { create: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: DRIZZLE, useValue: db },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  describe("add", () => {
    it("throws NotFoundException when listing does not exist", async () => {
      db._queue([]); // listing lookup returns nothing

      await expect(
        service.add("user-1", "nonexistent-listing"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException when already favorited (duplicate 23505)", async () => {
      db._queue([
        { id: "listing-1", title: "Kelso Stag", sellerId: "seller-1" },
      ]);
      const duplicateError: any = new Error("duplicate key value");
      duplicateError.code = "23505";
      db._queueValuesError(duplicateError);

      await expect(service.add("user-1", "listing-1")).rejects.toThrow(
        ConflictException,
      );
    });

    it("returns success and increments favorite count on new add", async () => {
      db._queue(
        [{ id: "listing-1", title: "Kelso Stag", sellerId: "seller-1" }],
        [{ userId: "seller-user-1" }], // seller lookup for notification
      );

      const result = await service.add("user-1", "listing-1");

      expect(result).toEqual({ message: "Added to favorites" });
      expect(db.insert).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });
  });
});
