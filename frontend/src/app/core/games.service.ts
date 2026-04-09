import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface LearningObjective {
  id: number;
  code: string;
  description: string;
  mastery?: number;
  attempts?: number;
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  engine: string;
  min_grade: string | null;
  max_grade: string | null;
  is_published: boolean;
  learning_objectives: LearningObjective[];
}

export interface GameSession {
  id: number;
  child_id: number;
  game_id: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  total_questions: number;
  correct_answers: number;
  score: number;
  started_at: string | null;
  ended_at: string | null;
}

interface SingleResponse<T> {
  data: T;
}

interface ListResponse<T> {
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);

  list(): Observable<Game[]> {
    return this.http.get<ListResponse<Game>>('/api/games').pipe(map((r) => r.data));
  }

  get(slug: string): Observable<Game> {
    return this.http
      .get<SingleResponse<Game>>(`/api/games/${slug}`)
      .pipe(map((r) => r.data));
  }

  startSession(gameId: number): Observable<GameSession> {
    return this.http
      .post<SingleResponse<GameSession>>('/api/game-sessions', { game_id: gameId })
      .pipe(map((r) => r.data));
  }

  answer(sessionId: number, learningObjectiveId: number, correct: boolean): Observable<GameSession> {
    return this.http
      .post<SingleResponse<GameSession>>(`/api/game-sessions/${sessionId}/answer`, {
        learning_objective_id: learningObjectiveId,
        correct,
      })
      .pipe(map((r) => r.data));
  }

  finish(sessionId: number): Observable<GameSession> {
    return this.http
      .post<SingleResponse<GameSession>>(`/api/game-sessions/${sessionId}/finish`, {})
      .pipe(map((r) => r.data));
  }
}
