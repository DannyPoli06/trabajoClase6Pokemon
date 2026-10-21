import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private apiUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  // Obtener la lista básica de Pokémon (nombres y URLs)
  getPokemons(limit: number = 25, offset: number = 0): Observable<any> {
    return this.http.get(`${this.apiUrl}/pokemon?limit=${limit}&offset=${offset}`);
  }

  // Obtener detalles de un Pokémon por nombre o ID
  getPokemonDetails(nameOrId: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pokemon/${nameOrId}`);
  }

  // Obtener la lista de Pokémon ya combinada con los detalles de cada uno (imágenes, tipos, estadísticas, etc.)
  getPokemonListWithDetails(limit: number = 25, offset: number = 0): Observable<any[]> {
    return this.getPokemons(limit, offset).pipe(
      switchMap((response: any) => {
        const detailRequests: Observable<any>[] = response.results.map((p: any) =>
          this.getPokemonDetails(p.name)
        );
        return forkJoin(detailRequests);
      })
    );
  }
}