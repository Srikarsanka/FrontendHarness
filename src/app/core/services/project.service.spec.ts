import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { environment } from '@env';
import { ProjectStatus } from '@shared/models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'A test project',
    status: ProjectStatus.ACTIVE,
    ownerId: 'user1',
    memberIds: ['user1', 'user2'],
    memberCount: 2,
    owner: { id: 'user1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN', createdAt: '' },
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should get projects', () => {
    service.getProjects().subscribe(projects => {
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Test Project');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
    expect(req.request.method).toBe('GET');
    req.flush([mockProject]);
  });

  it('should get a single project', () => {
    service.getProject('1').subscribe(project => {
      expect(project.id).toBe('1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  it('should create a project', () => {
    const newProject = { name: 'New', description: 'Desc' };
    service.createProject(newProject).subscribe(project => {
      expect(project.name).toBe('Test Project');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProject);
    req.flush(mockProject);
  });

  it('should update a project', () => {
    const update = { name: 'Updated' };
    service.updateProject('1', update).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockProject);
  });

  it('should delete a project', () => {
    service.deleteProject('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should add a member', () => {
    service.addMember('1', 'user3').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'user3' });
    req.flush(mockProject);
  });

  it('should remove a member', () => {
    service.removeMember('1', 'user2').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/projects/1/members/user2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockProject);
  });
});
