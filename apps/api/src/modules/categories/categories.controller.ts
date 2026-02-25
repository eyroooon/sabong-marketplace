import { Controller, Get, Param } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

@Controller()
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get("categories")
  getCategories() {
    return this.categoriesService.getCategories();
  }

  @Get("breeds")
  getBreeds() {
    return this.categoriesService.getBreeds();
  }

  @Get("breeds/:id/bloodlines")
  getBloodlines(@Param("id") id: number) {
    return this.categoriesService.getBloodlinesByBreed(id);
  }

  @Get("locations/provinces")
  getProvinces() {
    return this.categoriesService.getProvinces();
  }

  @Get("locations/cities/:province")
  getCities(@Param("province") province: string) {
    return this.categoriesService.getCitiesByProvince(province);
  }
}
