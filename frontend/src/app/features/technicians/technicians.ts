import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MasterDeskService } from '../../services/masterdesk.service';

@Component({
  selector: 'app-technicians',
  imports: [RouterLink],
  templateUrl: './technicians.html',
})
export class TechniciansPage {
  readonly data = inject(MasterDeskService);
}
