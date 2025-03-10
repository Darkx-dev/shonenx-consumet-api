import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const animepahe = new ANIME.AnimePahe();

  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the animepahe provider: check out the provider's website @ https://animepahe.com/",
      routes: ['/:query', '/info/:id', '/watch/:episodeId'],
      documentation: 'https://docs.consumet.org/#tag/animepahe',
    });
  });

  fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.params as { query: string }).query;

    const res = await animepahe.search(query);

    reply.status(200).send(res);
  });

  fastify.get('/info/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = decodeURIComponent((request.params as { id: string }).id);

    const episodePage = (request.query as { episodePage: number }).episodePage;

    try {
      const res = await animepahe
        .fetchAnimeInfo(id, episodePage)
        .catch((err) => reply.status(404).send({ message: err }));

      reply.status(200).send(res);
    } catch (err) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Contact developer for help.' });
    }
  });

  fastify.get(
    '/watch',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.query as { episodeId: string }).episodeId;

      if (!episodeId) {
        return reply.status(400).send({ message: 'episodeId is required' });
      }

      try {
        const res = await animepahe.fetchEpisodeSources(episodeId);
        if (!res || !res.sources || res.sources.length === 0) {
          return reply.status(404).send({ message: 'No sources found for this episode' });
        }

        reply.status(200).send(res);
      } catch (err) {
        console.error('Error fetching episode sources:', err);
        if (err instanceof Error) {
          reply.status(500).send({ 
            message: 'Failed to fetch episode sources',
            error: err.message
          });
        } else {
          reply.status(500).send({ 
            message: 'Failed to fetch episode sources',
            error: 'Unknown error occurred'
          });
        }
      }
    },
  );
};

export default routes;
