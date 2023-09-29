import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoChatComponent } from './video-chat/video-chat.component';

const routes: Routes = [
  {
    path: "",
    component: VideoChatComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
