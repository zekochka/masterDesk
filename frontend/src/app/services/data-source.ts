import { Observable } from 'rxjs';
import { Client, MasterDeskData, RepairOrder } from '../models/masterdesk.models';

/** Implement this contract with HttpClient when the backend is available. */
export abstract class MasterDeskDataSource {
  abstract load(): Observable<MasterDeskData>;
  abstract saveOrder(order: RepairOrder): Observable<RepairOrder>;
  abstract deleteOrder(id: number): Observable<void>;
  abstract saveClient(client: Client): Observable<Client>;
  abstract deleteClient(id: number): Observable<void>;
  abstract reset(): Observable<MasterDeskData>;
}
