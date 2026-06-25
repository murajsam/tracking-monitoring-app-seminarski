// osnovni URL backend-a - sve API rute krecu odavde
export const API_URL = "http://localhost:5000/api";

// vraca zaglavlje sa tokenom ako je korisnik prijavljen
// (ovo zaglavlje saljemo uz svaki zahtev koji trazi prijavu)
export function authHeader() {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: "Bearer " + token };
  } else {
    return {};
  }
}
