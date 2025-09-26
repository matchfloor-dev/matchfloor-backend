import { addDays, format, isSameDay, parse } from 'date-fns';
import { JwtService } from '@nestjs/jwt';

import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// entities
import { Appointment } from './entities/appointment.entity';
import { Residence } from '../residences/entities/residence.entity';
import { Agent } from '../agents/entities/agent.entity';

// enum
import { AppointmentStatus } from './enum/appointment-status.enum';

// services
import { ClientsService } from '../agencies/modules/clients/clients.service';
import { AgentsService } from '../agents/agents.service';
import { ResidencesService } from '../residences/residences.service';
import { AgentWorkingDaysService } from '../agents/modules/working-days/working-days.service';
import { ConfigurationService } from '../agencies/modules/configuration/configuration.service';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectRepository(Appointment)
        private readonly jwtService: JwtService,
        private readonly clientsService: ClientsService,
        private readonly residencesService: ResidencesService,
        private readonly agentsService: AgentsService,
        private readonly workingDaysService: AgentWorkingDaysService,
        private readonly configurationService: ConfigurationService,
        @InjectRepository(Residence)
        private readonly residencesRepository: Repository<Residence>,
    ) {}

    // method that returns all the appointments of a residence
    async getResidenceAppointments(id: number): Promise<Appointment[]> {
        const residence = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.appointments', 'appointments')
            .where('residence.id = :id', { id })
            .andWhere('residence.isDeleted = false')
            .getOne();

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        if (residence.appointments) {
            residence.appointments = residence.appointments.filter(
                (appointment) => !appointment.isDeleted,
            );
        }

        return residence.appointments || [];
    }

    // method that returns the availability of a residence from today to the time limit
    async getResidenceAvailability(
        residenceId: number,
        agencyId: number,
    ): Promise<any> {
        // Get the agents' availability (working days)
        const agentsAvailability = await this.getAgentsAvailability(
            residenceId,
            agencyId,
        );

        const config =
            await this.configurationService.getConfiguration(agencyId);
        const maxScheduleDays = config?.maxScheduleDays ?? 31;

        const appointments = await this.getResidenceAppointments(residenceId);
        const bookedAppointments = appointments.filter(
            (appointment) =>
                appointment.status !== AppointmentStatus.CANCELED &&
                appointment.status !== AppointmentStatus.REJECTED,
        );
        const notBookedAppointments = appointments.filter(
            (appointment) =>
                appointment.status === AppointmentStatus.CANCELED ||
                appointment.status === AppointmentStatus.REJECTED,
        );

        const residence = await this.residencesService.getById(
            +residenceId,
            agencyId,
        );
        const agents = residence.agents;

        const allAgentsAppointments = await this.getAgentsAppointments(
            agents,
            residenceId,
        );

        const today = new Date();
        const endDate = addDays(today, maxScheduleDays);
        const finalAvailability = {};

        for (
            let currentDate = today;
            currentDate <= endDate;
            currentDate = addDays(currentDate, 1)
        ) {
            const formattedDate = format(currentDate, 'dd-MM-yyyy');
            const dayOfWeek = currentDate.getDay() + 1;
            const dayAvailability = agentsAvailability[dayOfWeek];

            if (dayAvailability) {
                let availableSlots = this.getHourlySlots(dayAvailability);

                //Check for agents' appointments in other residences
                const otherAppointments = allAgentsAppointments.filter(
                    (appointment) =>
                        isSameDay(
                            parse(appointment.date, 'dd-MM-yyyy', new Date()),
                            currentDate,
                        ),
                );

                otherAppointments.forEach((appointment) => {
                    availableSlots = this.subtractTimeSlots(
                        availableSlots,
                        appointment.hour,
                        appointment.duration,
                    );
                });

                // Mark booked slots for residence appointments
                const bookedSlots = bookedAppointments.filter((appointment) =>
                    isSameDay(
                        parse(appointment.date, 'dd-MM-yyyy', new Date()),
                        currentDate,
                    ),
                );

                // If in availableSlots there is one (or more) slots that is in bookedSlots, remove it
                availableSlots = availableSlots.filter((slot) => {
                    return !bookedSlots.some((bookedSlot) => {
                        return (
                            bookedSlot.hour <= slot.startTime &&
                            bookedSlot.hour + bookedSlot.duration >=
                                slot.endTime
                        );
                    });
                });

                bookedSlots.forEach((appointment) => {
                    const bookedSlot = {
                        startTime: appointment.hour,
                        endTime: appointment.hour + appointment.duration,
                        booked: true,
                    };
                    availableSlots.push(bookedSlot);
                });

                //Mark not booked slots for residence appointments
                const notBookedSlots = notBookedAppointments.filter(
                    (appointment) =>
                        isSameDay(
                            parse(appointment.date, 'dd-MM-yyyy', new Date()),
                            currentDate,
                        ),
                );

                notBookedSlots.forEach((appointment) => {
                    const notBookedSlot = {
                        startTime: appointment.hour,
                        endTime: appointment.hour + appointment.duration,
                    };

                    // Check if the not booked slot already exists in availableSlots
                    const slotExists = availableSlots.some((slot) => {
                        return (
                            slot.startTime === notBookedSlot.startTime &&
                            slot.endTime === notBookedSlot.endTime
                        );
                    });

                    if (!slotExists) {
                        availableSlots.push(notBookedSlot);
                    }
                });

                // Mark any remaining loose slots as booked
                availableSlots.forEach((slot) => {
                    if (slot.endTime - slot.startTime < 1) {
                        slot.booked = true;
                    }
                });

                if (availableSlots.length > 0) {
                    finalAvailability[formattedDate] = availableSlots;
                } else {
                    finalAvailability[formattedDate] = [];
                }
            } else {
                finalAvailability[formattedDate] = [];
            }
        }
        //('finalAvailability', finalAvailability);

        // Return name of the residence and the availability
        return { name: residence.name, availability: finalAvailability };
    }

    // method that returns all the appointments of the agents of a residence
    async getAgentsAppointments(
        agents: Agent[],
        residenceId: number,
    ): Promise<Appointment[]> {
        const allAppointments = [];
        for (const agent of agents) {
            try {
                const appointments =
                    await this.agentsService.getAgentAppointments(agent.id);
                // If the appointment is from the residence, remove it
                const otherResidences = appointments.filter(
                    (appointment) =>
                        Number(appointment.residence.id) !==
                        Number(residenceId),
                );
                allAppointments.push(...otherResidences);
            } catch (error) {
                console.log(
                    `Error fetching appointments for agent ID ${agent.id}:`,
                    error,
                );
            }

            return allAppointments;
        }
    }

    // method that returns the working hours of the agents of a residence
    async getAgentsAvailability(
        residenceId: number,
        agencyId: number,
    ): Promise<any> {
        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        const agents = residence.agents;

        const allAvailability = await Promise.all(
            agents.map(async (agent) => {
                return await this.workingDaysService.getAvailability(agent.id);
            }),
        );

        // Flatten and group availability by day
        const availabilityByDay = {};

        for (const agentAvailability of allAvailability) {
            for (const day in agentAvailability) {
                if (!availabilityByDay[day]) {
                    availabilityByDay[day] = [];
                }

                availabilityByDay[day].push(...agentAvailability[day]);
            }
        }

        // Merge time slots for each day
        for (const day in availabilityByDay) {
            availabilityByDay[day] = this.mergeTimeSlots(
                availabilityByDay[day],
            );
        }

        return availabilityByDay;
    }

    private subtractTimeSlots(
        availability: any,
        startHour: any,
        duration: any,
    ): any {
        const endHour = startHour + duration;
        const newAvailability = [];

        for (const slot of availability) {
            if (slot.endTime <= startHour || slot.startTime >= endHour) {
                // no overlap, keep the slot
                newAvailability.push(slot);
            } else {
                // overlap exists, split the slot
                if (slot.startTime < startHour) {
                    newAvailability.push({
                        startTime: slot.startTime,
                        endTime: startHour,
                    });
                }
                if (slot.endTime > endHour) {
                    newAvailability.push({
                        startTime: endHour,
                        endTime: slot.endTime,
                    });
                }
            }
        }

        return newAvailability;
    }

    private mergeTimeSlots(timeSlots: any[]): any[] {
        if (timeSlots.length === 0) {
            return [];
        }

        // sort the time slots by start time
        timeSlots.sort((a, b) => a.startTime - b.startTime);

        const mergedTimeSlots = [timeSlots[0]];

        for (let i = 1; i < timeSlots.length; i++) {
            const current = timeSlots[i];
            const lastMerged = mergedTimeSlots[mergedTimeSlots.length - 1];

            if (current.startTime <= lastMerged.endTime) {
                lastMerged.endTime = Math.max(
                    lastMerged.endTime,
                    current.endTime,
                );
            } else {
                mergedTimeSlots.push(current);
            }
        }

        return mergedTimeSlots;

        // Example:
        // [
        //     { startTime: 10, endTime: 12 },
        //     { startTime: 11, endTime: 13 },
        //     { startTime: 14, endTime: 16 },
        //     { startTime: 15, endTime: 17 },
        // ]
        // should return
        // [
        //     { startTime: 10, endTime: 13 },
        //     { startTime: 14, endTime: 17 },
        // ]
    }

    // Helper function to split availability into hourly slots
    private getHourlySlots(dayAvailability: any[]): any[] {
        const hourlySlots = [];
        dayAvailability.forEach((slot) => {
            let { startTime, endTime } = slot;
            const startHalf = startTime % 1;
            const endHalf = endTime % 1;

            if (startHalf !== endHalf) {
                if (startHalf === 0.5) {
                    endTime = endTime - 0.5;
                } else {
                    startTime = startTime + 0.5;
                }
            }

            for (let hour = startTime; hour < endTime; hour++) {
                hourlySlots.push({ startTime: hour, endTime: hour + 1 });
            }
        });

        return hourlySlots;
    }
}
