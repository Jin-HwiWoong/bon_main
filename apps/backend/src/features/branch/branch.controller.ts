import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import type { BranchSummary } from "@bon/contracts";
import { AdminSessionGuard } from "../../common/guards/admin-session.guard";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { BranchService } from "./branch.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/branches")
export class BranchController {
  constructor(@Inject(BranchService) private readonly branchService: BranchService) {}

  @Get()
  list(): Promise<BranchSummary[]> {
    return this.branchService.list();
  }

  @Post()
  create(@Body() body: CreateBranchDto): Promise<BranchSummary> {
    return this.branchService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateBranchDto
  ): Promise<BranchSummary> {
    return this.branchService.update(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.branchService.delete(id);
  }
}
