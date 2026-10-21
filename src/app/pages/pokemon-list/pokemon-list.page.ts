import { Component, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  templateUrl: './pokemon-list.page.html',
  styleUrls: ['./pokemon-list.page.scss'],
})
export class PokemonListPage implements OnInit {
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';
  selectedPokemon: any = null;
  isModalOpen = false;

  constructor(private pokemonService: PokemonService) {}

  ngOnInit() {
    this.fetchPokemons();
  }

  fetchPokemons() {
    this.loading = true;
    this.pokemonService.getPokemonListWithDetails(24, 0).subscribe({
      next: (data) => {
        this.pokemons = data;
        this.filteredPokemons = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching Pokémon:', error);
        this.loading = false;
      },
    });
  }

  filterPokemons(event: any) {
    const query = (event.target.value || '').toLowerCase().trim();
    if (!query) {
      this.filteredPokemons = [...this.pokemons];
      return;
    }

    this.filteredPokemons = this.pokemons.filter((p) => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchId = p.id.toString() === query;
      const matchType = p.types.some((t: any) => t.type.name.toLowerCase().includes(query));
      return matchName || matchId || matchType;
    });
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  openDetails(pokemon: any) {
    this.selectedPokemon = pokemon;
    this.isModalOpen = true;
  }

  closeDetails() {
    this.isModalOpen = false;
    this.selectedPokemon = null;
  }

  handleRefresh(event: any) {
    this.pokemonService.getPokemonListWithDetails(24, 0).subscribe({
      next: (data) => {
        this.pokemons = data;
        this.filteredPokemons = data;
        event.target.complete();
      },
      error: (error) => {
        console.error('Error refreshing Pokémon:', error);
        event.target.complete();
      },
    });
  }

  getTypeColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'fire':
        return 'danger';
      case 'water':
        return 'primary';
      case 'grass':
        return 'success';
      case 'electric':
        return 'warning';
      case 'poison':
      case 'psychic':
      case 'ghost':
        return 'tertiary';
      case 'ice':
        return 'secondary';
      case 'dark':
      case 'rock':
      case 'ground':
        return 'dark';
      case 'bug':
        return 'success';
      default:
        return 'medium';
    }
  }

  getPokemonImage(pokemon: any): string {
    return (
      pokemon?.sprites?.other?.['official-artwork']?.front_default ||
      pokemon?.sprites?.front_default ||
      ''
    );
  }
}