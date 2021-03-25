import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  const payload = JSON.stringify({
    product_id: 1234,
    rating: 4,
    body: "This is some text, it needs to be 50 characters long, so I'm gonna put some more stuff here",
    recommend: false,
    name: 'test',
    email: 'test13@test.com',
    photos: [],
    characteristics: {
      4123: 4,
      4124: 3,
      4125: 3,
      4126: 3,
    },
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  http.post('http://localhost:3001/reviews/', payload, params);
}
