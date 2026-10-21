import { Component, OnInit } from '@angular/core';
import { PokemonService } from 'src/app/services/pokemon.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  pokemons: any[] = [];
  filteredPokemons: any[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';

  // Nivel 2 y 3: Detalle, Multimedia y Comparador
  selectedPokemon: any = null;
  comparePokemon: any = null;
  isModalOpen = false;
  activeDetailTab: 'info' | 'gallery' | 'compare' = 'info';
  selectedGalleryImage: string = '';

  // Audio / Grito
  isPlayingAudio = false;
  currentAudio: HTMLAudioElement | null = null;

  // Estadísticas a comparar
  statsToCompare = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

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
    this.selectedGalleryImage = this.getPokemonImage(pokemon);
    this.activeDetailTab = 'info';
    this.isModalOpen = true;

    // Asignar automáticamente un rival por defecto diferente para el comparador
    const rival = this.pokemons.find((p) => p.id !== pokemon.id);
    this.comparePokemon = rival || null;
  }

  closeDetails() {
    this.stopAudio();
    this.isModalOpen = false;
    this.selectedPokemon = null;
    this.comparePokemon = null;
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

  // ==========================================
  // NIVEL 2: MULTIMEDIA (Cries, Sprites, GIF)
  // ==========================================

  // Reproducir grito/sonido usando el campo 'cries' de PokeAPI
  playCry(pokemon: any) {
    if (!pokemon) return;

    // Detener audio previo si está sonando
    this.stopAudio();

    const audioUrl =
      pokemon.cries?.latest ||
      pokemon.cries?.legacy ||
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;

    try {
      this.isPlayingAudio = true;
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.volume = 0.6;
      this.currentAudio.onended = () => {
        this.isPlayingAudio = false;
      };
      this.currentAudio.onerror = () => {
        this.isPlayingAudio = false;
      };
      this.currentAudio.play().catch((err) => {
        console.warn('No se pudo reproducir el sonido:', err);
        this.isPlayingAudio = false;
      });
    } catch (err) {
      console.warn('Error al instanciar audio:', err);
      this.isPlayingAudio = false;
    }
  }

  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlayingAudio = false;
  }

  // Obtener sprite animado en formato GIF (Showdown o Gen 5 Black/White)
  getAnimatedSprite(pokemon: any): string {
    return (
      pokemon?.sprites?.other?.showdown?.front_default ||
      pokemon?.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
      ''
    );
  }

  // Galería de al menos 5 sprites oficiales del Pokémon
  getPokemonGallery(pokemon: any): { label: string; url: string; isGif?: boolean }[] {
    if (!pokemon || !pokemon.sprites) return [];
    const gallery: { label: string; url: string; isGif?: boolean }[] = [];

    // 1. Arte Oficial
    if (pokemon.sprites.other?.['official-artwork']?.front_default) {
      gallery.push({
        label: 'Arte Oficial',
        url: pokemon.sprites.other['official-artwork'].front_default,
      });
    }

    // 2. Sprite Animado GIF (Showdown)
    const animated = this.getAnimatedSprite(pokemon);
    if (animated) {
      gallery.push({
        label: 'Animado (GIF)',
        url: animated,
        isGif: true,
      });
    }

    // 3. Frontal Normal
    if (pokemon.sprites.front_default) {
      gallery.push({
        label: 'Frente',
        url: pokemon.sprites.front_default,
      });
    }

    // 4. Espalda Normal
    if (pokemon.sprites.back_default) {
      gallery.push({
        label: 'Espalda',
        url: pokemon.sprites.back_default,
      });
    }

    // 5. Frente Shiny ✨
    if (pokemon.sprites.front_shiny) {
      gallery.push({
        label: 'Frente Shiny ✨',
        url: pokemon.sprites.front_shiny,
      });
    }

    // 6. Espalda Shiny ✨
    if (pokemon.sprites.back_shiny) {
      gallery.push({
        label: 'Espalda Shiny ✨',
        url: pokemon.sprites.back_shiny,
      });
    }

    return gallery;
  }

  // ==========================================
  // NIVEL 3: COMPARADOR DE 2 POKÉMON
  // ==========================================

  selectPokemonForComparison(event: any) {
    const selectedId = Number(event.detail.value);
    this.comparePokemon = this.pokemons.find((p) => p.id === selectedId) || null;
  }

  getStatValue(pokemon: any, statName: string): number {
    if (!pokemon?.stats) return 0;
    const stat = pokemon.stats.find(
      (s: any) =>
        s.stat.name.toLowerCase() === statName.toLowerCase() ||
        s.stat.name.toLowerCase().replace('-', '') === statName.toLowerCase().replace('-', '')
    );
    return stat ? stat.base_stat : 0;
  }

  getTotalStats(pokemon: any): number {
    if (!pokemon?.stats) return 0;
    return pokemon.stats.reduce((acc: number, s: any) => acc + s.base_stat, 0);
  }

  getStatWinner(statName: string): 1 | 2 | 0 {
    const val1 = this.getStatValue(this.selectedPokemon, statName);
    const val2 = this.getStatValue(this.comparePokemon, statName);
    if (val1 > val2) return 1;
    if (val2 > val1) return 2;
    return 0; // Empate
  }

  formatStatName(stat: string): string {
    switch (stat) {
      case 'hp':
        return 'PS (HP)';
      case 'attack':
        return 'Ataque';
      case 'defense':
        return 'Defensa';
      case 'special-attack':
        return 'Atq. Esp.';
      case 'special-defense':
        return 'Def. Esp.';
      case 'speed':
        return 'Velocidad';
      default:
        return stat.toUpperCase();
    }
  }

  // ==========================================
  // UTILIDADES GENERALES
  // ==========================================

  getPokemonImage(pokemon: any): string {
    return (
      pokemon?.sprites?.other?.['official-artwork']?.front_default ||
      pokemon?.sprites?.front_default ||
      ''
    );
  }

  getTypeColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'fire':
        return 'danger';
      case 'water':
        return 'primary';
      case 'grass':
      case 'bug':
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
      default:
        return 'medium';
    }
  }
}
