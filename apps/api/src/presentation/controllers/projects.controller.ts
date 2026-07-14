import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { ProjectService } from '../../application/services/project.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

class CreateProjectDto {
  name!: string;
  description?: string;
  sourceType!: 'local' | 'zip' | 'github';
  githubUrl?: string;
  githubBranch?: string;
}

@ApiTags('projects')
@Controller('api/v1/projects')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private projectService: ProjectService,
    private storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Req() req: { user: { id: string } }, @Body() dto: CreateProjectDto) {
    return this.projectService.create(req.user.id, dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a zip file for analysis' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    const key = `uploads/${req.user.id}/${uuidv4()}.zip`;
    await this.storageService.upload(key, file.buffer, 'application/zip');
    return this.projectService.createFromUpload(req.user.id, name || file.originalname, 'zip', key, description);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Req() req: { user: { id: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.projectService.findAll(req.user.id, page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.projectService.findOne(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async delete(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    await this.projectService.delete(req.user.id, id);
    return { success: true };
  }

  @Post(':id/reanalyze')
  @ApiOperation({ summary: 'Trigger re-analysis' })
  async reanalyze(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.projectService.reanalyze(req.user.id, id);
  }
}
