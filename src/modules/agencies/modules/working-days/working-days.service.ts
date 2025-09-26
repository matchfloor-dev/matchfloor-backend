import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// entities
import { WorkingDays } from './entities/working-day.entity';
import { WorkingTimeSlot } from './entities/working-time-slot.entity';

// dto
import { CreateWorkingDayDto } from './dto/create-working-day.dto';
import { UpdateWorkingDayDto } from './dto/update-working-day.dto';
import { UpdateWorkingTimeSlotDto } from './dto/update-working-time-slot.dto';

// enum
import { Days } from 'src/shared/enum/days.enum';

// interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

@Injectable()
export class WorkingDaysService implements CRUD<WorkingDays> {
    constructor(
        @InjectRepository(WorkingDays)
        private readonly workingDaysRepository: Repository<WorkingDays>,
        @InjectRepository(WorkingTimeSlot)
        private readonly workingTimeSlotRepository: Repository<WorkingTimeSlot>,
    ) {}

    async create(
        createWorkingDayDto: CreateWorkingDayDto,
        agencyId: number,
    ): Promise<WorkingDays> {
        // Check if the working day for the specified day and agency already exists
        const existingWorkingDay = await this.workingDaysRepository.findOne({
            where: { day: createWorkingDayDto.day, agencyId, isDeleted: false },
            relations: ['timeSlots'],
        });

        // If the working day exists, throw an error
        if (existingWorkingDay) {
            throw new BadRequestException('ERR_WORKING_DAY_EXISTS');
        }

        // If the working day doesn't exist, create a new one
        const newWorkingDay = this.workingDaysRepository.create({
            ...createWorkingDayDto,
            agencyId,
            timeSlots: [], // Initialize an empty array of time slots
        });

        // Return the newly created working day
        return await this.workingDaysRepository.save(newWorkingDay);
    }

    async getAll(agencyId: number): Promise<WorkingDays[]> {
        // Fetch existing working days for the agency
        const existingWorkingDays = await this.workingDaysRepository.find({
            where: { agencyId, isDeleted: false },
            relations: ['timeSlots'],
        });

        // Create a set of the existing days
        const existingDays = new Set(existingWorkingDays.map((day) => day.day));

        // Iterate over all days of the week defined in the enum
        for (const dayEnum in Days) {
            if (!isNaN(Number(dayEnum))) {
                const dayValue = Number(dayEnum); // Convert the enum key to a number

                // Check if this day exists, if not, create a new record
                if (!existingDays.has(dayValue)) {
                    const newWorkingDay = this.workingDaysRepository.create({
                        day: dayValue, // Assign the day as the numeric value
                        isOffDay: false, // Set default values, adjust as needed
                        agencyId,
                        timeSlots: [], // Initialize an empty array of time slots
                    });

                    // Save the newly created working day
                    await this.workingDaysRepository.save(newWorkingDay);

                    // Add the newly created day to the list of existing working days
                    existingWorkingDays.push(newWorkingDay);
                }
            }
        }

        // Return all working days, including the newly created ones
        return existingWorkingDays;
    }

    async getById(id: number, agencyId: number): Promise<WorkingDays> {
        const workingDay = await this.workingDaysRepository.findOne({
            where: { id, agencyId, isDeleted: false },
            relations: ['timeSlots'],
        });

        if (!workingDay) {
            throw new NotFoundException('ERR_WORKING_DAY_NOT_FOUND');
        }

        return workingDay;
    }

    // Make an update working day method that delete all time slots and create new ones, instead of updating them
    async update(
        id: number,
        updateWorkingDayDto: UpdateWorkingDayDto,
        agencyId: number,
    ): Promise<WorkingDays> {
        // Check if the working day for the specified day and agency already exists
        const existingWorkingDay = await this.workingDaysRepository.findOne({
            where: { id, agencyId, isDeleted: false },
            relations: ['timeSlots'],
        });

        // If the working day exists, add the time slots to it
        if (existingWorkingDay) {
            // Delete all time slots
            await this.workingTimeSlotRepository.delete({
                workingDayId: existingWorkingDay.id,
            });

            // Validate each time slot before proceeding
            for (const timeSlot of updateWorkingDayDto.timeSlots) {
                this.validateTimeSlot(timeSlot.startTime, timeSlot.endTime);
            }

            // Check if overlapping time slots already exist
            const isOverlapping =
                await this.checkOverlapping(updateWorkingDayDto);
            if (isOverlapping) {
                throw new NotFoundException(
                    'ERR_WORKING_TIMESLOTS_OVERLAPPING',
                );
            }

            // Add new time slots to the existing working day
            for (const timeSlot of updateWorkingDayDto.timeSlots) {
                const newTimeSlot = {
                    ...timeSlot,
                    workingDay: existingWorkingDay, // Associate with the existing working day
                };
                await this.workingTimeSlotRepository.save(newTimeSlot);
            }

            // Update the working day details
            await this.workingDaysRepository.update(
                { id: existingWorkingDay.id },
                {
                    isOffDay: updateWorkingDayDto.isOffDay,
                    updatedAt: new Date(),
                },
            );

            //await this.workingDaysRepository.save(existingWorkingDay);

            const updatedWorkingDay = await this.workingDaysRepository.findOne({
                where: { id: existingWorkingDay.id },
                relations: ['timeSlots'],
            });
            return updatedWorkingDay;
        } else {
            throw new NotFoundException('ERR_WORKING_DAY_NOT_FOUND');
        }
    }

    async updateTimeSlot(
        workingDayId: number,
        timeSlotId: number,
        updateTimeSlotDto: UpdateWorkingTimeSlotDto,
        agencyId: number,
    ): Promise<WorkingTimeSlot> {
        // First, check if the working day exists
        await this.getById(workingDayId, agencyId);

        // Find the specific time slot to update
        const timeSlot = await this.workingTimeSlotRepository.findOne({
            where: { id: timeSlotId, workingDayId: workingDayId },
        });

        if (!timeSlot) {
            throw new NotFoundException('ERR_TIME_SLOT_NOT_FOUND');
        }

        // Validate the updated time slot
        this.validateTimeSlot(
            updateTimeSlotDto.startTime
                ? updateTimeSlotDto.startTime
                : timeSlot.startTime,
            updateTimeSlotDto.endTime
                ? updateTimeSlotDto.endTime
                : timeSlot.endTime,
        );

        // Update the time slot details
        const updatedTimeSlot = {
            ...timeSlot,
            ...updateTimeSlotDto,
            updatedAt: new Date(),
        };

        await this.workingTimeSlotRepository.save(updatedTimeSlot);

        return updatedTimeSlot;
    }

    async delete(id: number, agencyId: number): Promise<void> {
        const workingDay = await this.getById(id, agencyId);

        if (!workingDay) {
            throw new NotFoundException('ERR_WORKING_DAY_NOT_FOUND');
        }

        const saveWorkingDay = {
            ...workingDay,
            isDeleted: true,
        };

        await this.workingDaysRepository.save(saveWorkingDay);
    }

    async deleteTimeSlot(
        workingDayId: number,
        timeSlotId: number,
        agencyId: number,
    ): Promise<void> {
        // First, check if the working day exists
        await this.getById(workingDayId, agencyId);

        // Find the specific time slot to delete
        const timeSlot = await this.workingTimeSlotRepository.findOne({
            where: { id: timeSlotId, workingDayId: workingDayId },
        });

        if (!timeSlot) {
            throw new NotFoundException('ERR_TIME_SLOT_NOT_FOUND');
        }

        //If is the last time slot, delete the working day
        const workingDay = await this.workingDaysRepository.findOne({
            where: { id: workingDayId },
            relations: ['timeSlots'],
        });

        if (workingDay.timeSlots.length === 1) {
            await this.delete(workingDayId, agencyId);
            return;
        } else {
            await this.workingTimeSlotRepository.delete(timeSlotId);
        }
    }

    // Function to get the max start time and min end time of all the working days
    async getMinMaxTimeHours(agencyId: number): Promise<any> {
        const workingDays = await this.workingDaysRepository.find({
            where: { agencyId, isDeleted: false },
            relations: ['timeSlots'],
        });

        let minHour = 24;
        let maxHour = 0;

        for (const workingDay of workingDays) {
            if (!workingDay.isOffDay && workingDay.timeSlots.length === 0) {
                return { minHour: 0, maxHour: 24 };
            }
        }

        for (const workingDay of workingDays) {
            if (workingDay.isOffDay) {
                continue;
            }

            for (const timeSlot of workingDay.timeSlots) {
                if (timeSlot.startTime < minHour) {
                    minHour = timeSlot.startTime;
                }

                if (timeSlot.endTime > maxHour) {
                    maxHour = timeSlot.endTime;
                }
            }
        }

        if (minHour === 24 && maxHour === 0) {
            return { minHour: 0, maxHour: 24 };
        }

        return { minHour, maxHour };
    }

    // Helper to validate time slots
    validateTimeSlot(startTime: number, endTime: number): void {
        if (startTime >= endTime) {
            throw new BadRequestException(
                'ERR_INVALID_TIME_RANGE_START_HIGHER_THAN_END',
            );
        }

        if (startTime < 0 || startTime > 24 || endTime < 0 || endTime > 24) {
            throw new BadRequestException(
                'ERR_INVALID_TIME_RANGE_OUT_OF_BOUNDS',
            );
        }

        if (startTime === endTime) {
            throw new BadRequestException(
                'ERR_INVALID_TIME_RANGE_START_EQUAL_TO_END',
            );
        }

        if (
            !this.isValidTimeIncrement(startTime) ||
            !this.isValidTimeIncrement(endTime)
        ) {
            throw new BadRequestException(
                'ERR_INVALID_TIME_RANGE_NOT_INCREMENTS_OF_HALF',
            );
        }

        if (endTime - startTime < 1) {
            throw new BadRequestException(
                'ERR_INVALID_TIME_RANGE_LESS_THAN_ONE_HOUR',
            );
        }
    }

    // Helper to check if a time is in 0.5 increments
    isValidTimeIncrement(time: number): boolean {
        return time % 0.5 === 0;
    }

    // Check if any time slot overlaps with the existing one for the same day
    async checkOverlapping(dto: UpdateWorkingDayDto): Promise<boolean> {
        // Check if the dto time slots overlap with each other
        for (let i = 0; i < dto.timeSlots.length; i++) {
            for (let j = i + 1; j < dto.timeSlots.length; j++) {
                if (
                    this.isOverlapping(
                        dto.timeSlots[i].startTime,
                        dto.timeSlots[i].endTime,
                        dto.timeSlots[j].startTime,
                        dto.timeSlots[j].endTime,
                    )
                ) {
                    return true;
                }
            }
        }
    }

    // Helper to check if two time slots overlap
    isOverlapping(
        start1: number,
        end1: number,
        start2: number,
        end2: number,
    ): boolean {
        return start1 < end2 && end1 > start2;
    }
}
