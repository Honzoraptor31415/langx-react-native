import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { IonContent, ToastController } from '@ionic/angular';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/User';
import { ErrorInterface } from 'src/app/models/types/errors/error.interface';
import { getContributorsAction } from 'src/app/store/actions/contributors.action';
import { currentUserSelector } from 'src/app/store/selectors/auth.selector';
import {
  errorSelector,
  isLoadingSelector,
  usersSelector,
} from 'src/app/store/selectors/contributors.selector';

@Component({
  selector: 'app-fundamentals',
  templateUrl: './fundamentals.page.html',
  styleUrls: ['./fundamentals.page.scss'],
})
export class FundamentalsPage implements OnInit {
  @ViewChild(IonContent) content: IonContent;

  subscription: Subscription;

  isLoading$: Observable<boolean> = null;
  currentUser$: Observable<User> = null;
  users$: Observable<User[] | null> = null;

  noUser = {
    icon: 'people-outline',
    title: 'No Users Yet',
    color: 'warning',
  };

  constructor(
    private store: Store,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initValues();
    // Get all chat Rooms
    this.listContributors();
  }

  ionViewWillEnter() {
    this.subscription = new Subscription();

    // User Errors
    this.subscription.add(
      this.store
        .pipe(select(errorSelector))
        .subscribe((error: ErrorInterface) => {
          if (error) {
            this.presentToast(error.message, 'danger');
            // TODO: Clear error message if it will be shown
          }
        })
    );
  }

  ionViewWillLeave() {
    // Unsubscribe from all subscriptions
    this.subscription.unsubscribe();
  }

  initValues() {
    this.isLoading$ = this.store.pipe(select(isLoadingSelector));
    this.users$ = this.store.pipe(select(usersSelector));
    this.currentUser$ = this.store.pipe(select(currentUserSelector));
  }

  listContributors() {
    // Dispatch action to get all contributors
    this.store.dispatch(getContributorsAction());
  }

  //
  // Routes
  //

  getProfilePage(userId: string) {
    this.router.navigateByUrl('/home/user/' + userId);
  }

  async openDiscordPage() {
    await Browser.open({ url: environment.ext.socialMedia.discord });
  }

  //
  // Pull to refresh
  //

  handleRefresh(event) {
    this.listContributors();
    if (event) event.target.complete();
  }

  //
  // Present Toast
  //

  async presentToast(msg: string, color?: string) {
    const toast = await this.toastController.create({
      message: msg,
      color: color || 'primary',
      duration: 1000,
      position: 'top',
    });

    await toast.present();
  }
}
