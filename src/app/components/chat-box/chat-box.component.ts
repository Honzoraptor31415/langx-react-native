import { Store, select } from '@ngrx/store';
import { Observable, of, take } from 'rxjs';
import { Browser } from '@capacitor/browser';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import {
  IonItemSliding,
  ModalController,
  ToastController,
} from '@ionic/angular';
import {
  Component,
  Input,
  OnInit,
  ElementRef,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import { MessageService } from 'src/app/services/chat/message.service';
import { FcmService } from 'src/app/services/fcm/fcm.service';
import { PreviewPhotoComponent } from 'src/app/components/preview-photo/preview-photo.component';
import { urlify } from 'src/app/extras/utils';
import { Message } from 'src/app/models/Message';
import { updateMessageRequestInterface } from 'src/app/models/types/requests/updateMessageRequest.interface';
import { updateMessageAction } from 'src/app/store/actions/message.action';
import { messagesSelector } from 'src/app/store/selectors/message.selector';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBoxComponent implements OnInit, OnChanges {
  @ViewChild('itemSlidingSender') itemSlidingSender: IonItemSliding;
  @ViewChild('itemSlidingReveiver') itemSlidingReveiver: IonItemSliding;

  @Input() chat: Message;
  @Input() current_user_id: string;
  @Output() onReply: EventEmitter<any> = new EventEmitter();
  @Output() onEdit: EventEmitter<any> = new EventEmitter();
  @Output() onDelete: EventEmitter<any> = new EventEmitter();
  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  @Output() onIgnore: EventEmitter<any> = new EventEmitter();

  private observer: IntersectionObserver;

  msg: Message = null;
  replyTo: string = null;
  replyToMessage$: Observable<Message>;

  messageSegments: Array<{ type: string; content: string }> = [];

  audioRef: HTMLAudioElement = null;
  audioId: string = null;
  isDownloaded: boolean = false;
  isPlaying: boolean = false;

  imageURL$: Observable<URL> = null;
  audioURL$: Observable<URL> = null;

  isCopilotAssisted: boolean = false;

  constructor(
    private store: Store,
    private messageService: MessageService,
    private fcmService: FcmService,
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private changeDetectorRef: ChangeDetectorRef,
    private el: ElementRef
  ) {}

  async ngOnInit() {
    await this.initValues();
    this.changeDetectorRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chat']) {
      this.msg = { ...this.chat };
      // Check if the message is a body
      if (this.msg.type === 'body') {
        this.messageSegments = urlify(this.msg?.body);

        if (this.msg.copilot?.correction !== undefined) {
          this.isCopilotAssisted = true;
        } else {
          this.isCopilotAssisted = false;
        }

        this.changeDetectorRef.detectChanges();
      }

      // Check if the message is an image
      if (this.msg.type === 'image') {
        if (this.msg.imageId) {
          this.imageURL$ = this.messageService.getMessageImageView(
            this.msg.imageId
          );
          // Fixing ExpressionChangedAfterItHasBeenCheckedError
          this.imageURL$.subscribe(() => {
            // console.log('Image URL here !');
            this.changeDetectorRef.detectChanges();
          });
        }
      }

      // Check if the message is an audio
      if (this.msg.type === 'audio') {
        if (this.msg.audioId) {
          this.audioURL$ = this.messageService.getMessageAudioView(
            this.msg.audioId
          );
        }
      }
    }
  }

  ngAfterViewInit() {
    // This is for the seen action when the message is in view
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => this.handleIntersect(entry));
    });
    this.observer.observe(this.el.nativeElement);

    if (this.msg.type === 'image') {
      if (!this.msg.imageId) {
        // Use a placeholder image URL
        this.msg.type = 'body';
        this.msg.body = '📷 Image Message';
        this.messageSegments = urlify(this.msg?.body);
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  ngAfterViewLeave() {
    this.observer.disconnect();
  }

  async initValues() {
    this.msg = { ...this.chat };

    if (this.msg && this.msg.type === 'body') {
      this.messageSegments = urlify(this.msg?.body);
    }

    // Check if the message has replyTo
    if (this.msg.replyTo) {
      // Set the replyTo message id
      this.replyTo = this.msg.replyTo;

      // Get the replyTo message
      this.store
        .pipe(select(messagesSelector), take(1))
        .subscribe((messages) => {
          const replyToMessage = messages
            ? messages.find((m) => m.$id === this.replyTo)
            : null;

          if (replyToMessage) {
            this.replyToMessage$ = of(replyToMessage);
          } else {
            this.replyToMessage$ = this.messageService.getMessageById(
              this.msg.replyTo
            );
          }
        });
    }

    // Check if the message is an audio
    if (this.msg.type === 'audio') {
      this.audioId = this.msg?.$id;
      await this.readFiles(this.msg?.$id);
    }
  }

  //
  // Reply
  //

  reply(msg: Message) {
    this.itemSlidingSender.close();
    this.itemSlidingReveiver.close();

    // emit the message to the parent component
    this.onReply.emit(msg);
  }

  //
  // Edit
  //

  edit(msg: Message) {
    this.itemSlidingSender.close();
    this.itemSlidingReveiver.close();

    if (this.msg.type === 'audio') {
      this.presentToast('You cannot edit an audio message', 'danger');
      return;
    }

    if (this.msg.type === 'image') {
      this.presentToast('You cannot edit an image message', 'danger');
      return;
    }

    if (this.msg.deleted === true) {
      this.presentToast('You cannot edit a deleted message', 'danger');
      return;
    }

    // emit the message to the parent component
    this.onEdit.emit(msg);
  }

  //
  // Delete
  //

  delete(msg: Message) {
    this.onDelete.emit(msg);
    this.itemSlidingSender.close();
    this.itemSlidingReveiver.close();
  }

  //
  // Utils for audio
  //

  async play(fileName: string) {
    const audioFile = await Filesystem.readFile({
      path: fileName,
      directory: Directory.Data,
    });
    // console.log('Audio file', audioFile);
    const base64Sound = audioFile.data;
    // console.log('Base64 Audio:', base64Sound);

    // Play the audio file
    this.audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`);
    this.audioRef.oncanplaythrough = () => {
      // console.log('Audio file duration', this.audioRef.duration);
    };
    this.audioRef.onended = () => {
      this.audioRef = null;
      this.updateIsPlaying();
    };
    this.audioRef.load();
    this.updateIsPlaying();
    return this.audioRef.play();
  }

  async stop() {
    if (this.audioRef) {
      this.audioRef.pause();
      this.audioRef.currentTime = 0;
      this.updateIsPlaying();
    }
  }

  async togglePlayStop() {
    this.isPlaying ? this.stop() : await this.play(this.audioId);
  }

  private updateIsPlaying() {
    this.isPlaying = !this.isPlaying;
    this.changeDetectorRef.detectChanges();
  }

  // Download file from server
  async downloadFile() {
    this.audioURL$.subscribe(async (url) => {
      // console.log('URL:', url);
      if (url) {
        const response = await fetch(url);
        const blob = await response.blob();

        // Create a new FileReader instance
        const reader = new FileReader();

        const base64Audio = await new Promise((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        });

        // TODO: Take a look here to see if we can use the base64Audio directly
        const base64AudioString = base64Audio.toString();

        const fileName = this.msg.$id;
        await Filesystem.writeFile({
          path: fileName,
          data: base64AudioString,
          directory: Directory.Data,
        });

        console.log('Download complete');
        this.isDownloaded = true;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private async readFiles(id: string) {
    try {
      const ret = await Filesystem.readFile({
        path: id,
        directory: Directory.Data,
      });
      this.audioRef = new Audio('data:audio/aac;base64,' + ret.data);
      this.isDownloaded = true;
      this.changeDetectorRef.detectChanges();
    } catch (e) {
      // Download file from server
      this.downloadFile();
    }
  }

  //
  // Utils for seen
  //

  handleIntersect(entry) {
    if (entry.isIntersecting) {
      if (this.msg.to === this.current_user_id && this.msg.seen === false) {
        const request: updateMessageRequestInterface = {
          $id: this.msg.$id,
          data: {
            seen: true,
          },
        };
        // Dispatch action to update message seen status
        this.store.dispatch(updateMessageAction({ request }));

        // Delete local notification if exists
        if (Capacitor.isNativePlatform()) {
          this.fcmService.deleteNotificationById(this.msg.$id);
        }
      }
    }
  }

  //
  // Utils for image preview
  //

  async openPreview(photos$: Observable<URL | URL[]>): Promise<void> {
    photos$.subscribe(async (photos) => {
      if (photos) {
        const modal = await this.modalCtrl.create({
          component: PreviewPhotoComponent,
          componentProps: {
            photos: Array.isArray(photos) ? photos : [photos],
          },
        });
        modal.present();
      }
    });
  }

  //
  // Utils for clipboard
  //
  writeToClipboard(text: string) {
    if (Capacitor.isNativePlatform()) {
      Clipboard.write({
        string: text,
      })
        .then(() => {
          this.presentToast('Copied!');
        })
        .catch((e) => {
          console.error('Error copying text to clipboard', 'danger');
        });
    }
  }

  //
  // Utils for URL and Actions
  //

  parseUrl(url: string): string {
    const parsedUrl = new URL(url);
    let result = parsedUrl.hostname;
    if (parsedUrl.pathname !== '/') {
      result += parsedUrl.pathname;
    }
    return result;
  }

  async openPage(url: string) {
    await Browser.open({ url: url });
  }

  //
  // Copilot
  //

  confirmCopilotCorrection(msg: Message) {
    this.onConfirm.emit(msg);
  }
  ignoreCopilotCorrection(msg: Message) {
    this.onIgnore.emit(msg);
  }

  //
  // Present Toast
  //

  async presentToast(msg: string, color?: string) {
    const toast = await this.toastController.create({
      message: msg,
      color: color || 'primary',
      duration: 300,
      position: 'top',
    });

    await toast.present();
  }
}
