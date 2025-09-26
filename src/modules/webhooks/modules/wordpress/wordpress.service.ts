import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Request } from 'express';

// services
import { JwtService } from '@nestjs/jwt';
import { ResidencesService } from 'src/modules/residences/residences.service';
import { AgenciesService } from 'src/modules/agencies/agencies.service';

// dto
import { WordpressReisdencesDto } from './dto/wordpress-residences.dto';
import { CreateResidenceDto } from 'src/modules/residences/dto/create-residence.dto';

// entities
import { Residence } from 'src/modules/residences/entities/residence.entity';
import { ResidencesSources } from 'src/modules/residences/enum/residence-sources.enum';

@Injectable()
export class WordpressService {
    private logger = new Logger(WordpressService.name);

    constructor(
        private readonly residencesService: ResidencesService,
        private readonly agenciesService: AgenciesService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Handles the submission of residences from a wordpress site.
     * Creates the residences in the database, or updates the existing ones.
     * @param data
     * @returns
     */
    async handleResidencesSubmission(
        data: WordpressReisdencesDto[],
        req: Request,
    ): Promise<Residence[]> {
        // get the token from the request
        // const bearer = req.headers['authorization']
        //     ? req.headers['authorization']
        //     : '';
        // const token = bearer.split(' ')[1];
        // const payload = await this.jwtService.decode(token);
        const agencyId = req['agencyId'];
        // get the agency
        const agency = await this.agenciesService.getById(agencyId);
        this.logger.log('agency: ', agency);

        if (!agency) {
            throw new NotFoundException('ERR_TOKEN_INVALID_AGENCY');
        }

        // build the residences array
        const residences: CreateResidenceDto[] = data.map((residence) => {
            return {
                name: residence.title,
                ownerEmail: residence.email ? residence.email : agency.email,
                identifiers: Object.values(residence),
                allAgents: true,
                agentsIds: [],
                source: ResidencesSources.WORDPRESS,
            };
        });

        console.log("agencyId: ", agencyId);
        // Get all exiting residences from the agency
        const existingResidences =
            await this.residencesService.getAll(agencyId);

        console.log('existingResidences: ', existingResidences);

        // save the residences
        for (const residence of residences) {
            console.log("[ANALIZING RESIDENCE]: ", residence);
            // Find the residence
            const residenceFound = existingResidences.find((r) => {
                if (residence.identifiers) {
                    console.log("[IDENTIFIERS]: ", residence.identifiers);
                    console.log("[R.IDENTIFIERS]: ", r.identifiers);
                    return (
                        String(r.identifiers) ===
                            String(residence.identifiers)
                    );
                }

                return (
                    r.name == residence.name &&
                    r.ownerEmail == residence.ownerEmail
                );
            });

            console.log("[RESIDENCE FOUND]: ", residenceFound);

            if (residenceFound) {
                // remove hardocded value all agents
                residence.allAgents = residenceFound.allAgents;
                await this.residencesService.update(
                    residenceFound.id,
                    residence,
                    agencyId,
                );
            } else {
                await this.residencesService.create(residence, agencyId);
            }
        }

        return this.residencesService.getAll(agencyId);
    }
}
