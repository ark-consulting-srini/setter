// AP Computer Science Principles MC Exam Review — Study Guide
// Source: Teacher-provided study guide (Spring 2026)
// Organized by Big Idea for targeted quiz generation

export interface StudyGuideSection {
  bigIdea: number
  title: string
  examWeight: string
  topics: StudyGuideTopic[]
}

export interface StudyGuideTopic {
  id: string
  name: string
  content: string
}

export const AP_CSP_EXAM_INFO = `
AP CSP Exam — May 14, 2026 at 12:00pm
Section I: 70 Multiple-Choice Questions | 120 Minutes | 70% of Score
  - 57 single-select multiple-choice
  - 5 single-select with reading passage about a computing innovation
  - 8 multiple-select multiple-choice: select 2 answers
Section II: Create Performance Task and Written Response
  - 2 written response questions | 60 minutes | 20% of score
  - Create performance task program code, video, and Personalized Project Reference | 9 hours in-class | 10% of score
`

export const AP_CSP_STUDY_GUIDE: StudyGuideSection[] = [
  {
    bigIdea: 1,
    title: 'Creative Development',
    examWeight: '10-13%',
    topics: [
      {
        id: '1.1',
        name: 'Collaboration',
        content: `Incorporating multiple perspectives through collaboration improves computing innovations as they are developed.
A computing innovation includes a program as an integral part of its function.
A computing innovation can be physical (e.g., self-driving car), non-physical computing software (e.g., picture editing software), or a non-physical computing concept (e.g., e-commerce).
Effective collaboration produces a computing innovation that reflects the diversity of talents and perspectives of those who designed it.
Collaboration that includes diverse perspectives helps avoid bias in the development of computing innovations.
Consultation and communication with users are important aspects of the development of computing innovations.
Information gathered from potential users can be used to understand the purpose of a program from diverse perspectives and to develop a program that fully incorporates these perspectives.
Online tools support collaboration by allowing programmers to share and provide feedback on ideas and documents.
Common models such as pair programming exist to facilitate collaboration.
Effective collaborative teams practice interpersonal skills, including but not limited to: Communication, Consensus building, Conflict resolution, Negotiation.`,
      },
      {
        id: '1.2',
        name: 'Program Function and Purpose',
        content: `Developers create and innovate using an iterative design process that is user-focused, that incorporates implementation/feedback cycles, and that leaves ample room for experimentation and risk-taking.
The purpose of computing innovations is to solve problems or to pursue interests through creative expression.
An understanding of the purpose of a computing innovation provides developers with an improved ability to develop that computing innovation.
A program is a collection of program statements that performs a specific task when run by a computer. A program is often referred to as software.
A code segment is a collection of program statements that is part of a program.
A program needs to work for a variety of inputs and situations.
The behavior of a program is how a program functions during execution and is often described by how a user interacts with it.
A program can be described broadly by what it does, or in more detail by both what the program does and how the program statements accomplish this function.
Program inputs are data sent to a computer for processing by a program. Input can come in a variety of forms, such as tactile, audio, visual, or text. Inputs usually affect the output produced by a program.
An event is associated with an action and supplies input data to a program. Events can be generated when a key is pressed, a mouse is clicked, a program is started, or any other defined action occurs that affects the flow of execution.
In event-driven programming, program statements are executed when triggered rather than through the sequential flow of control.
Input can come from a user or other programs.
Program outputs are any data sent from a program to a device. Program output can come in a variety of forms, such as tactile, audio, visual, or text.
Program output is usually based on a program's input or prior state (e.g., internal values).`,
      },
      {
        id: '1.3',
        name: 'Program Design and Development',
        content: `A development process can be ordered and intentional, or exploratory in nature.
There are multiple development processes. The following phases are commonly used when developing a program: investigating and reflecting, designing, prototyping, testing.
A development process that is iterative requires refinement and revision based on feedback, testing, or reflection throughout the process. This may require revisiting earlier phases of the process.
A development process that is incremental is one that breaks the problem into smaller pieces and makes sure each piece works before adding it to the whole.
The design of a program incorporates investigation to determine its requirements.
Investigation in a development process is useful for understanding and identifying the program constraints, as well as the concerns and interests of the people who will use the program.
Program requirements describe how a program functions and may include a description of user interactions that a program must provide.
In a collaborative development process, members of the team may explore the use of online collaboration tools. Information gathered from potential users can be used to understand the purpose of a program from diverse perspectives and to develop a program that fully incorporates these perspectives.
Program documentation is a written description of the function of a code segment, event, procedure, or program and how it was developed.
Comments are a form of program documentation written into the program to be read by people and do not affect how a program runs.
Programmers should document a program throughout its development.
Program documentation helps in developing and maintaining correct programs when working individually or in collaborative programming environments.
Not all effects of a program are predictable.`,
      },
      {
        id: '1.4',
        name: 'Identifying and Correcting Errors',
        content: `A logic error is a mistake in the algorithm or program that causes it to behave incorrectly or unexpectedly.
A syntax error is a mistake in the program where the rules of the programming language are not followed.
A run-time error is a mistake in the program that occurs during the execution of a program. Programming languages define their own runtime errors.
An overflow error is an error that occurs when a computer attempts to handle a number that is outside of the defined range of values.
The following are effective ways to find and correct errors: test cases, hand tracing, visualizations, debuggers, adding extra output statement(s).
Identify inputs and corresponding expected outputs or behaviors that can be used to check the correctness of an algorithm or program.
In the development process, testing uses defined inputs to ensure that an algorithm or program is producing the expected outcomes. Programmers use the results from testing to revise their algorithms or programs.
Defined inputs used to test a program should demonstrate the different expected outcomes that are at or just beyond the extremes (boundary values) of input data.
Programs should be tested at extremes and boundaries, as well as typical cases.
Testing, debugging, and maintaining programs is a significant part of the development process.`,
      },
    ],
  },
  {
    bigIdea: 2,
    title: 'Data',
    examWeight: '17-22%',
    topics: [
      {
        id: '2.1',
        name: 'Binary Numbers',
        content: `A bit is a binary digit, and it's the smallest unit of data. A byte is 8 bits.
A bit can be 0 or 1. A sequence of bits is used to represent data of many types.
Number bases, including binary, decimal, and hexadecimal, are used to represent and investigate digital data.
In binary (base 2), each place is worth twice as much as the one to its right: 1, 2, 4, 8, 16, 32, 64, 128, etc.
Converting between binary and decimal:
  Binary 1011 = 1×8 + 0×4 + 1×2 + 1×1 = 11 in decimal
Number values are converted between number bases, including binary, decimal, and hexadecimal.
Hexadecimal uses 16 digits: 0-9 and A-F (A=10, B=11, C=12, D=13, E=14, F=15).
Each hex digit represents 4 binary digits. For example, hex A3 = 1010 0011 in binary.`,
      },
      {
        id: '2.2',
        name: 'Data Compression',
        content: `Data compression reduces the size (number of bits) of transmitted or stored data.
Fewer bits does not necessarily mean less information.
The amount of size reduction from compression depends on both the amount of redundancy in the original data representation and the compression algorithm applied.
Lossless data compression algorithms can usually reduce the number of bits stored or transmitted while guaranteeing complete reconstruction of the original data.
Lossy data compression algorithms can significantly reduce the number of bits stored or transmitted but only allow reconstruction of an approximation of the original data.
Lossy data compression can reduce the number of bits stored or transmitted at the cost of being able to reconstruct only an approximation of the original data.
In situations where quality or ability to reconstruct the original is important, lossless compression algorithms are typically chosen.
In situations where quality or ability to reconstruct the original is not as important (like streaming music or video), lossy compression algorithms may be chosen.`,
      },
      {
        id: '2.3',
        name: 'Extracting Information from Data',
        content: `Information is the collection of facts and patterns extracted from data.
Data provide opportunities for identifying trends, making connections, and addressing problems.
Digitally processed data may show correlation between variables. A correlation found in data does not necessarily indicate that a causal relationship exists. Additional research is needed to understand the exact nature of the relationship.
Often, a single source does not contain the data needed to draw a conclusion. It may be necessary to combine data from a variety of sources to formulate a conclusion.
Metadata are data about data. For example, the piece of data may be an image, while the metadata may include the date of creation or the file size of the image.
Changes and deletions made to metadata do not change the primary data.
Metadata are used for finding, organizing, and managing information.
Metadata can increase the effective use of data or data sets by providing additional information.
Metadata allow data to be structured and organized.
The ability to process data depends on the capabilities of the users and their tools.
Data sets pose challenges regardless of size, such as: the need to clean data, incomplete data, invalid data, the need to combine data sources.
Cleaning data is a process that makes the data uniform without changing their meaning (e.g., replacing all equivalent abbreviations, spellings, and capitalizations with the same word).
Problems of bias are often created by the type or source of data being collected. Bias is not eliminated by simply collecting more data.
The size of a data set affects the amount of information that can be extracted from it.
Large data sets are difficult to process using a single computer and may require parallel systems.
Scalability of systems is an important consideration when working with data sets.`,
      },
      {
        id: '2.4',
        name: 'Using Programs with Data',
        content: `Programs can be used to process data to acquire information.
Tables, diagrams, text, and other visual tools can be used to communicate insight and knowledge gained from data.
Search tools are useful for efficiently finding information.
Data filtering systems are important tools for finding information and recognizing patterns in data.
Programs such as spreadsheets help efficiently organize and find trends in information.
Some processes that can be used to extract or modify information from data include:
  - Transforming every element of a data set, such as doubling every element in a list, or adding a parent's email to every student record
  - Filtering a data set, such as keeping only the positive numbers from a list, or keeping only students who signed up for band
  - Combining or comparing data in some way, such as adding up a list of numbers, or finding the student who has the highest GPA
  - Visualizing a data set through a chart, graph, or other visual representation
Programs are used in an iterative and interactive way when processing information to allow users to gain insight and knowledge about data.
Programmers can use programs to filter and clean digital data, thereby gaining insight and knowledge.
Combining data sources, clustering data, and classifying data are parts of the process of using programs to gain insight and knowledge from data.
Insight and knowledge can be obtained from translating and transforming digitally represented information.
Patterns can emerge when data are transformed using programs.`,
      },
    ],
  },
  {
    bigIdea: 3,
    title: 'Algorithms and Programming',
    examWeight: '30-35%',
    topics: [
      {
        id: '3.1',
        name: 'Variables and Assignments',
        content: `A variable is an abstraction inside a program that can hold a value. Each variable has associated data storage that represents one value at a time, but that value can be a list or other collection that in turn contains multiple values.
Using meaningful variable names helps with the readability of program code and understanding of what values are represented by the variables.
Some programming languages provide types to represent data, which are referenced using variables. These types include numbers, Booleans, lists, and strings.
Some values are better suited to representation using one type of datum rather than another.
The assignment operator allows a program to change the value represented by a variable.
The value stored in a variable will be the most recent value assigned. For example:
  a \u2190 1
  b \u2190 a
  a \u2190 2
  display(b) -- displays 1, not 2`,
      },
      {
        id: '3.2',
        name: 'Data Abstraction',
        content: `A list is an ordered sequence of elements. For example, [value1, value2, value3, ...].
An element is an individual value in a list that is assigned a unique index.
An index is a common method for referencing the elements in a list or string using natural numbers.
A string is an ordered sequence of characters.
Data abstraction provides a separation between the abstract properties of a data type and the concrete details of its representation.
Data abstractions manage complexity in programs by giving a collection of data a name without referencing the specific details of the representation.
Data abstractions can be created using lists.
Developing a data abstraction to implement in a program can result in a program that is easier to develop and maintain.
Data abstractions often contain different types of elements.
The use of lists allows multiple related items to be treated as a single value. Lists are referred to by different names, such as array, depending on the programming language.`,
      },
      {
        id: '3.3-3.4',
        name: 'Mathematical Expressions and Strings',
        content: `Sequencing is the application of each step of an algorithm in the order in which the code statements are given.
A code statement is a part of program code that expresses an action to be carried out.
An expression can consist of a value, a variable, an operator, or a procedure call that returns a value.
Expressions are evaluated to produce a single value.
Sequential statements execute in the order they appear in the code segment.
Arithmetic operators include addition (+), subtraction (-), multiplication (*), division (/), and modulus (MOD).
a MOD b evaluates to the remainder when a is divided by b. For example, 17 MOD 5 evaluates to 2.
The MOD operator has the same precedence as * and /.
The order of operations used in mathematics applies when evaluating expressions.
String concatenation joins together two or more strings end-to-end to make a new string.
A substring is part of an existing string.`,
      },
      {
        id: '3.5',
        name: 'Boolean Expressions',
        content: `A Boolean value is either true or false.
Relational operators: = (equal), \u2260 (not equal), > (greater than), < (less than), \u2265 (greater than or equal), \u2264 (less than or equal).
A comparison using a relational operator evaluates to a Boolean value.
Logical operators: NOT, AND, OR — these evaluate to a Boolean value.
The operand for a logical operator is either a Boolean expression or a single Boolean value.`,
      },
      {
        id: '3.6-3.7',
        name: 'Conditionals and Nested Conditionals',
        content: `Selection determines which parts of an algorithm are executed based on a condition being true or false.
Conditional statements, or "if-statements," affect the sequential flow of control by executing different statements based on the value of a Boolean expression.
Nested conditional statements consist of conditional statements within conditional statements.`,
      },
      {
        id: '3.8',
        name: 'Iteration',
        content: `Iteration is a repeating portion of an algorithm. Iteration repeats a specified number of times or until a given condition is met.
Iteration statements change the sequential flow of control by repeating a set of statements zero or more times, until a stopping condition is met.
In REPEAT UNTIL(condition) iteration, an infinite loop occurs when the ending condition will never evaluate to true.
In REPEAT UNTIL(condition) iteration, if the conditional evaluates to true initially, the loop body is not executed at all, due to the condition being checked before the loop.`,
      },
      {
        id: '3.9',
        name: 'Developing Algorithms',
        content: `Algorithms can be written in different ways and still accomplish the same tasks.
Algorithms that appear similar can yield different side effects or results.
Some conditional statements can be written as equivalent Boolean expressions.
Some Boolean expressions can be written as equivalent conditional statements.
Different algorithms can be developed or used to solve the same problem.
Algorithms can be created from an idea, by combining existing algorithms, or by modifying existing algorithms.
Knowledge of existing algorithms can help in constructing new ones. Some existing algorithms include:
  - Determining the maximum or minimum value of two or more numbers
  - Computing the sum or average of two or more numbers
  - Identifying if an integer is or is not evenly divisible by another integer
  - Determining a robot's path through a maze
Using existing correct algorithms as building blocks for constructing another algorithm has benefits such as reducing development time, reducing testing, and simplifying the identification of errors.`,
      },
      {
        id: '3.10',
        name: 'Lists',
        content: `List procedures are implemented in accordance with the syntax rules of the programming language.
Traversing a list can be a complete traversal, where all elements in the list are accessed, or a partial traversal, where only a portion of elements are accessed.
Iteration statements can be used to traverse a list.
Knowledge of existing algorithms that use iteration can help in constructing new algorithms. Some examples include:
  - Determining a minimum or maximum value in a list
  - Computing a sum or average of a list of numbers
  - Linear search or sequential search algorithms check each element of a list, in order, until the desired value is found or all elements in the list have been checked.`,
      },
      {
        id: '3.11',
        name: 'Binary Search',
        content: `The binary search algorithm starts at the middle of a sorted data set of numbers and eliminates half of the data; this process repeats until the desired value is found or all elements have been eliminated.
Data must be in sorted order to use the binary search algorithm.
Binary search is often more efficient than sequential/linear search when applied to sorted data.`,
      },
      {
        id: '3.12-3.13',
        name: 'Procedures',
        content: `A procedure is a named group of programming instructions that may have parameters and return values. Procedures are referred to by different names, such as method or function, depending on the programming language.
Parameters are input variables of a procedure. Arguments specify the values of the parameters when a procedure is called.
A procedure call interrupts the sequential execution of statements, causing the program to execute the statements within the procedure before continuing. Once the last statement in the procedure (or a return statement) has executed, flow of control is returned to the point immediately following where the procedure was called.
One common type of abstraction is procedural abstraction, which provides a name for a process and allows a procedure to be used only knowing what it does, not how it does it.
Procedural abstraction allows a solution to a large problem to be based on the solutions of smaller subproblems.
The subdivision of a computer program into separate subprograms is called modularity.
A procedural abstraction may extract shared features to generalize functionality instead of duplicating code.
Using parameters allows procedures to be generalized, enabling the procedures to be reused with a range of input values or arguments.
Using procedural abstraction helps improve code readability.`,
      },
      {
        id: '3.14',
        name: 'Libraries',
        content: `A software library contains procedures that may be used in creating new programs.
Existing code segments can come from internal or external sources, such as libraries or previously written code.
The use of libraries simplifies the task of creating complex programs.
Application program interfaces (APIs) are specifications for how the procedures in a library behave and can be used.
Documentation for an API/library is necessary in understanding the behaviors provided by the API/library and how to use them.`,
      },
      {
        id: '3.15',
        name: 'Random Values',
        content: `Using random number generation in a program means each execution may produce a different result.`,
      },
      {
        id: '3.16',
        name: 'Simulations',
        content: `Simulations are abstractions of more complex objects or phenomena for a specific purpose.
A simulation is a representation that uses varying sets of values to reflect the changing state of a phenomenon.
Simulations often mimic real-world events with the purpose of drawing inferences, allowing investigation of a phenomenon without the constraints of the real world.
The process of developing an abstract simulation involves removing specific details or simplifying functionality.
Simulations can contain bias derived from the choices of real-world elements that were included or excluded.
Simulations are most useful when real-world events are impractical for experiments (e.g., too big, too small, too fast, too slow, too expensive, or too dangerous).
Simulations facilitate the formulation and refinement of hypotheses related to the objects or phenomena under consideration.
Random number generators can be used to simulate the variability that exists in the real world.`,
      },
      {
        id: '3.17',
        name: 'Algorithmic Efficiency',
        content: `There exist problems that computers cannot solve, and even when a computer can solve a problem, it may not be able to do so in a reasonable amount of time.
A problem is a general description of a task that can (or cannot) be solved algorithmically. An instance of a problem also includes specific input.
A decision problem is a problem with a yes/no answer (e.g., is there a path from A to B?).
An optimization problem is a problem with the goal of finding the "best" solution among many (e.g., what is the shortest path from A to B?).
Efficiency is an estimation of the amount of computational resources used by an algorithm. Efficiency is typically expressed as a function of the size of the input.
An algorithm's efficiency is determined through formal or mathematical reasoning.
An algorithm's efficiency can be informally measured by determining the number of times a statement or group of statements executes.
Different correct algorithms for the same problem can have different efficiencies.
Algorithms with a polynomial efficiency or slower (constant, linear, square, cube, etc.) are said to run in a reasonable amount of time.
Algorithms with exponential or factorial efficiencies are examples of algorithms that run in an unreasonable amount of time.
Some problems cannot be solved in a reasonable amount of time because there is no efficient algorithm for solving them. In these cases, approximate solutions are sought.
A heuristic is an approach to a problem that produces a solution that is not guaranteed to be optimal but may be used when techniques that are guaranteed to always find an optimal solution are impractical.`,
      },
      {
        id: '3.18',
        name: 'Undecidable Problems',
        content: `A decidable problem is a decision problem for which an algorithm can be written to produce a correct output for all inputs (e.g., "Is the number even?").
An undecidable problem is one for which no algorithm can be constructed that is always capable of providing a correct yes-or-no answer.
An undecidable problem may have some instances that have an algorithmic solution, but there is no algorithmic solution that could solve all instances of the problem.`,
      },
    ],
  },
  {
    bigIdea: 4,
    title: 'Computer Systems and Networks',
    examWeight: '11-15%',
    topics: [
      {
        id: '4.1',
        name: 'The Internet',
        content: `A computing device is a physical artifact that can run a program. Some examples include computers, tablets, servers, routers, and smart sensors.
A computing system is a group of computing devices and programs working together for a common purpose.
A computer network is a group of interconnected computing devices capable of sending or receiving data.
A computer network is a type of computing system.
A path between two computing devices on a computer network (a sender and a receiver) is a sequence of directly connected computing devices that begins at the sender and ends at the receiver.
Routing is the process of finding a path from sender to receiver.
The bandwidth of a computer network is the maximum amount of data that can be sent in a fixed amount of time. Bandwidth is usually measured in bits per second.
The Internet is a computer network consisting of interconnected networks that use standardized, open (nonproprietary) communication protocols.
Access to the Internet depends on the ability to connect a computing device to an Internet-connected device.
A protocol is an agreed-upon set of rules that specify the behavior of a system.
The protocols used in the Internet are open, which allows users to easily connect additional computing devices to the Internet.
Routing on the Internet is usually dynamic; it is not specified in advance.
The scalability of a system is the capacity for the system to change in size and scale to meet new demands. The Internet was designed to be scalable.
Information is passed through the Internet as a data stream. Data streams contain chunks of data, which are encapsulated in packets.
Packets contain a chunk of data and metadata used for routing the packet between the origin and the destination on the Internet, as well as for data reassembly.
Packets may arrive at the destination in order, out of order, or not at all.
IP, TCP, and UDP are common protocols used on the Internet.
The World Wide Web is a system of linked pages, programs, and files. HTTP is a protocol used by the World Wide Web. The World Wide Web uses the Internet.`,
      },
      {
        id: '4.2',
        name: 'Fault Tolerance',
        content: `The Internet has been engineered to be fault-tolerant, with abstractions for routing and transmitting data.
Redundancy is the inclusion of extra components that can be used to mitigate failure of a system if other components fail.
One way to accomplish network redundancy is by having more than one path between any two connected devices.
If a particular device or connection on the Internet fails, subsequent data will be sent via a different route, if possible.
When a system can support failures and still continue to function, it is called fault-tolerant.
Redundancy within a system often requires additional resources but can provide the benefit of fault tolerance.
The redundancy of routing options between two points increases the reliability of the Internet and helps it scale to more devices and more people.`,
      },
      {
        id: '4.3',
        name: 'Parallel and Distributed Computing',
        content: `Sequential computing is a computational model in which operations are performed in order one at a time.
Parallel computing is a computational model where the program is broken into multiple smaller sequential computing operations, some of which are performed simultaneously.
Distributed computing is a computational model in which multiple devices are used to run a program.
Comparing efficiency of solutions can be done by comparing the time it takes them to perform the same task.
A sequential solution takes as long as the sum of all of its steps.
A parallel computing solution takes as long as its sequential tasks plus the longest of its parallel tasks.
The "speedup" of a parallel solution is measured in the time it took to complete the task sequentially divided by the time it took to complete the task when done in parallel.
Solutions that use parallel computing can scale more effectively than solutions that use sequential computing.
Distributed computing allows problems to be solved that could not be solved on a single computer because of either the processing time or storage needs involved.
Distributed computing allows much larger problems to be solved quicker than they could be solved using a single computer.
When increasing the use of parallel computing in a solution, the efficiency of the solution is still limited by the sequential portion. This means that at some point, adding parallel portions will no longer meaningfully increase efficiency.`,
      },
    ],
  },
  {
    bigIdea: 5,
    title: 'Impact of Computing',
    examWeight: '21-26%',
    topics: [
      {
        id: '5.1',
        name: 'Beneficial and Harmful Effects',
        content: `While computing innovations are typically designed to achieve a specific purpose, they may have unintended consequences.
People create computing innovations. The way people complete tasks often changes to incorporate new computing innovations.
Not every effect of a computing innovation is anticipated in advance.
A single effect can be viewed as both beneficial and harmful by different people, or even by the same person.
Advances in computing have generated and increased creativity in other fields, such as medicine, engineering, communications, and the arts.
Computing innovations can be used in ways that their creators had not originally intended:
  - The World Wide Web was originally intended only for rapid and easy exchange of information within the scientific community.
  - Targeted advertising is used to help businesses, but it can be misused at both individual and aggregate levels.
  - Machine learning and data mining have enabled innovation in medicine, business, and science, but information discovered in this way has also been used to discriminate against groups of individuals.
Responsible programmers try to consider the unintended ways their computing innovations can be used and the potential beneficial and harmful effects of these new uses.
It is not possible for a programmer to consider all the ways a computing innovation can be used.
Rapid sharing of a program or running a program with a large number of users can result in significant impacts beyond the intended purpose or control of the programmer.`,
      },
      {
        id: '5.2',
        name: 'Digital Divide',
        content: `Internet access varies between socioeconomic, geographic, and demographic characteristics, as well as between countries.
The "digital divide" refers to differing access to computing devices and the Internet, based on socioeconomic, geographic, or demographic characteristics.
The digital divide can affect both groups and individuals.
The digital divide raises issues of equity, access, and influence, both globally and locally.
The digital divide is affected by the actions of individuals, organizations, and governments.`,
      },
      {
        id: '5.3',
        name: 'Computing Bias',
        content: `Computing innovations can reflect existing human biases because of biases written into the algorithms or biases in the data used by the innovation.
Programmers should take action to reduce bias in algorithms used for computing innovations as a way of combating existing human biases.
Biases can be embedded at all levels of software development.`,
      },
      {
        id: '5.4',
        name: 'Crowdsourcing',
        content: `Widespread access to information and public data facilitates the identification of problems, development of solutions, and dissemination of results.
Science has been affected by using distributed and "citizen science" to solve scientific problems.
Citizen science is scientific research conducted in whole or part by distributed individuals, many of whom may not be scientists, who contribute relevant data to research using their own computing devices.
Crowdsourcing is the practice of obtaining input or information from a large number of people via the Internet.
Human capabilities can be enhanced by collaboration via computing.
Crowdsourcing offers new models for collaboration, such as connecting businesses or social causes with funding.`,
      },
      {
        id: '5.5',
        name: 'Legal and Ethical Concerns',
        content: `Material created on a computer is the intellectual property of the creator or an organization.
Ease of access and distribution of digitized information raises intellectual property concerns regarding ownership, value, and use.
Measures should be taken to safeguard intellectual property.
The use of material created by someone else without permission and presented as one's own is plagiarism and may have legal consequences.
Some examples of legal ways to use materials created by someone else include:
  - Creative Commons — a public copyright license that enables the free distribution of an otherwise copyrighted work.
  - Open source — programs that are made freely available and may be redistributed and modified.
  - Open access — online research output free of any and all restrictions on access and free of many restrictions on use.
The use of material created by someone other than you should always be cited.
Creative Commons, open source, and open access have enabled broad access to digital information.
As with any technology or medium, using computing to harm individuals or groups of people raises legal and ethical concerns.
Computing can play a role in social and political issues, which in turn often raises legal and ethical concerns.
Computing innovations can raise legal and ethical concerns, such as:
  - The development of software that allows access to digital media downloads and streaming.
  - The development of algorithms that include bias.
  - The existence of computing devices that collect and analyze data by continuously monitoring activities.`,
      },
      {
        id: '5.6',
        name: 'Safe Computing',
        content: `Personally identifiable information (PII) is information about an individual that identifies, links, relates, or describes them. Examples include: Social Security number, age, race, phone number(s), medical information, financial information, biometric data.
Search engines can record and maintain a history of searches made by users.
Websites can record and maintain a history of individuals who have viewed their pages.
Devices, websites, and networks can collect information about a user's location.
Technology enables the collection, use, and exploitation of information about, by, and for individuals, groups, and institutions.
Disparate personal data, such as geolocation, cookies, and browsing history, can be aggregated to create knowledge about an individual.
PII stored online can be used to simplify making online purchases.
Commercial and governmental curation of information may be exploited if privacy and other protections are ignored.
Information placed online can be used in ways that were not intended and that may have a harmful impact.
PII can be used to stalk or steal the identity of a person or to aid in the planning of other criminal acts.
Once information is placed online, it is difficult to delete.
Authentication measures protect devices and information from unauthorized access. Examples include strong passwords and multifactor authentication.
A strong password is something that is easy for a user to remember but would be difficult for someone else to guess based on knowledge of that user.
Multifactor authentication is a method of computer access control in which a user is only granted access after successfully presenting several separate pieces of evidence, typically in at least two of the following categories: knowledge (something they know), possession (something they have), and inherence (something they are).
Encryption is the process of encoding data to prevent unauthorized access. Decryption is the process of decoding the data.
Symmetric key encryption involves one key for both encryption and decryption.
Public key encryption pairs a public key for encryption and a private key for decryption. The sender does not need the receiver's private key to encrypt a message, but the receiver's private key is required to decrypt the message.
Certificate authorities issue digital certificates that validate the ownership of encryption keys used in secure communications and are based on a trust model.
A computer virus is a malicious program that can copy itself and gain access to a computer in an unauthorized way.
Malware is software intended to damage a computing system or to take partial control over its operation.
All real-world systems have errors or design flaws that can be exploited to compromise them. Regular software updates help fix errors that could compromise a computing system.
Phishing is a technique that attempts to trick a user into providing personal information.
Keylogging is the use of a program to record every keystroke made by a computer user in order to gain fraudulent access to passwords and other confidential information.
Data sent over public networks can be intercepted, analyzed, and modified. One way that this can happen is through a rogue access point.
A rogue access point is a wireless access point that gives unauthorized access to secure networks.
Unsolicited emails, attachments, links, and forms in emails can be used to compromise the security of a computing system.`,
      },
    ],
  },
]

/** Get all topic IDs and names for UI display */
export function getStudyGuideTopicList(): Array<{ id: string; bigIdea: number; bigIdeaTitle: string; name: string; examWeight: string }> {
  return AP_CSP_STUDY_GUIDE.flatMap((section) =>
    section.topics.map((topic) => ({
      id: topic.id,
      bigIdea: section.bigIdea,
      bigIdeaTitle: `Big Idea ${section.bigIdea}: ${section.title}`,
      name: `${topic.id} ${topic.name}`,
      examWeight: section.examWeight,
    }))
  )
}

/** Get study guide content for specific topic IDs (or all if empty) */
export function getStudyGuideContent(topicIds?: string[]): string {
  const sections = AP_CSP_STUDY_GUIDE.map((section) => {
    const topics = topicIds?.length
      ? section.topics.filter((t) => topicIds.includes(t.id))
      : section.topics

    if (topics.length === 0) return null

    const topicText = topics
      .map((t) => `### Topic ${t.id}: ${t.name}\n${t.content}`)
      .join('\n\n')

    return `## Big Idea ${section.bigIdea}: ${section.title} (${section.examWeight})\n\n${topicText}`
  }).filter(Boolean)

  return sections.join('\n\n---\n\n')
}
