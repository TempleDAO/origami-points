
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
   const resp = await fetch('https://origami.automation-templedao.link/points_allocation');
   res.setHeader('Cache-Control', 'public, s-maxage=3600');
   res.send(await resp.text());  
}
