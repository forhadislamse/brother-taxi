import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";
import { vehicleRoutes } from "../modules/vehicle/vehicle.routes";
import { fareRoutes } from "../modules/fare/fare.routes";
import path from "path";
import { carTransportRoutes } from "../modules/carTransport/carTransport.routes";
import { estimateFareRoutes } from "../modules/estimateFare/estimateFare.routes";
import { chatRoutes } from "../../chats/chats.routes";




const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  // {
  //   path: "/tutor-and-booking",
  //   route: findTutorAndBookingRoutes
  // },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/fares",
    route: fareRoutes,
  },

  {
    path: "/vehicle",
    route: vehicleRoutes,
  },

  {
    path: "/carTransports",
    route: carTransportRoutes,
  },
  {
    path: "/estimateFares",
    route: estimateFareRoutes,
  },

  {
    path: "/chats",
    route: chatRoutes,
  },
  // {
  //   path: "/tutors",
  //   route: tutorRoutes
  // },
  // {
  //   path: "/payments",
  //   route: paymentRoutes,
  // },
  // {
  //   path: "/notifications",
  //   route: notificationsRoute,
  // },
  // {
  //   path: "/reviews",
  //   route: ReviewRoutes,
  // },
  // {
  //   path: "/chat-images",
  //   route: chatImageRoutes,
  // },
  // {
  //   path: "/favorite-tutor",
  //   route: favoriteTutorRoutes,
  // },
  // {
  //   path: "/admins",
  //   route: adminRoutes
  // }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
