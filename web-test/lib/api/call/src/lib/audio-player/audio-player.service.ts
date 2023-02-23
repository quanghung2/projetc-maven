import { Injectable } from '@angular/core';
import { AudioWebRTC, TypeSound } from './audio-player.model';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private _audios: AudioWebRTC[] = [];
  constructor() {}

  importFileAudios(audios: AudioWebRTC[]) {
    this._audios = this._audios.concat(audios);
  }

  play(name: TypeSound, isLoop = false, relativeVolume = 1) {
    console.log('play: ', name);
    this.stop();
    const sound = this._audios.find(audio => audio.name.toUpperCase() === name.toUpperCase());
    if (!sound) {
      return;
    }

    sound.audio.currentTime = 0.0;
    sound.audio.volume = relativeVolume;

    if (isLoop) {
      sound.audio.loop = true;
    }
    sound.audio.play();
    // const media = sound.audio.play();
    // if (!media) {
    //   media
    //     .then(_ => {
    //       // Autoplay started!
    //     })
    //     .catch(error => {
    //       // Autoplay was prevented.
    //       // Show a "Play" button so that user can start playback.
    //     });
    // }

    // const isPlaying =
    //   sound.audio.currentTime > 0 && !sound.audio.paused && !sound.audio.ended && sound.audio.readyState > 2;

    // if (!isPlaying) {
    //   sound.audio.play();
    // }

    // this.playMedia(sound.audio);
  }

  stop() {
    this._audios.forEach(s => (!s.audio.paused ? s.audio.pause() : null));
  }

  private playMedia(audio: HTMLAudioElement, count = 0) {
    const isPlaying = audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2;

    if (!isPlaying) {
      audio.play();
    } else {
      count++;
      if (count < 10) {
        setTimeout(() => {
          this.playMedia(audio, count);
        }, 100);
      }
    }
  }
}
